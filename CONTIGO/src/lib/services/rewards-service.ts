import { createBrowserClient } from '@/lib/supabase/client';
import { Reward, RewardClaim } from '@/types/database';

export interface RewardWithClaimStatus {
  id: string;
  title: string;
  description?: string;
  points_required: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  has_been_claimed?: boolean;
  can_redeem?: boolean;
}

export interface RewardClaimWithDetails {
  id: string;
  reward_id: string;
  claimed_at: string;
  notes?: string;
  reward?: {
    id: string;
    title: string;
    description?: string;
    points_required: number;
  };
}

export interface RewardsService {
  getRewardsForChild(childId: string): Promise<{
    child: {
      id: string;
      name: string;
      points_balance: number;
    };
    rewards: RewardWithClaimStatus[];
  }>;
  
  claimReward(rewardId: string, notes?: string): Promise<{
    claim: RewardClaimWithDetails;
    new_balance: number;
  }>;
}

export class RewardsServiceImpl implements RewardsService {
  private supabase;

  constructor() {
    this.supabase = createBrowserClient();
  }

  async getRewardsForChild(childId: string) {
    try {
      // Obtener información del niño
      const { data: child, error: childError } = await this.supabase
        .from('children')
        .select('id, name, points_balance')
        .eq('id', childId)
        .single();

      if (childError || !child) {
        throw new Error(`Error al obtener información del niño: ${childError?.message}`);
      }

      // Obtener recompensas del niño
      const { data: rewards, error: rewardsError } = await this.supabase
        .from('rewards')
        .select(`
          id,
          title,
          description,
          points_required,
          is_active,
          created_at,
          updated_at,
          reward_claims(id, claimed_at)
        `)
        .eq('child_id', childId)
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (rewardsError) {
        throw new Error(`Error al obtener recompensas: ${rewardsError.message}`);
      }

      // Procesar recompensas para determinar si ya fueron canjeadas
      const processedRewards: RewardWithClaimStatus[] = rewards?.map(reward => {
        const hasBeenClaimed = reward.reward_claims && reward.reward_claims.length > 0;
        return {
          id: reward.id,
          title: reward.title,
          description: reward.description,
          points_required: reward.points_required,
          is_active: reward.is_active,
          created_at: reward.created_at,
          updated_at: reward.updated_at,
          has_been_claimed: hasBeenClaimed,
          can_redeem: !hasBeenClaimed && child.points_balance >= reward.points_required,
        };
      }) || [];

      return {
        child: {
          id: child.id,
          name: child.name,
          points_balance: child.points_balance,
        },
        rewards: processedRewards,
      };
    } catch (error) {
      console.error('Error en getRewardsForChild:', error);
      throw error;
    }
  }

  async claimReward(rewardId: string, notes?: string) {
    try {
      const response = await fetch('/api/reward-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reward_id: rewardId,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al canjear recompensa');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error en claimReward:', error);
      throw error;
    }
  }
}

// Exportar una instancia por defecto del servicio
export const rewardsService = new RewardsServiceImpl();