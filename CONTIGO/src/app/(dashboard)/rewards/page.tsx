'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Plus, Edit, Trash2, Trophy, Star, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import Link from 'next/link';
import { Reward } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { AlertModal } from '@/components/ui/alert-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function RewardsPage() {
  const router = useRouter();
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<any[]>([]);
  const [childPoints, setChildPoints] = useState(0);
  const [claimingReward, setClaimingReward] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (children.length === 0) {
      router.push('/children/new');
      return;
    }

    if (!selectedChild && children.length > 0) {
      setSelectedChild(children[0]);
    }
  }, [user, children, selectedChild, setSelectedChild, router]);

  useEffect(() => {
    if (selectedChild) {
      fetchRewards();
      fetchChildPoints();
    }
  }, [selectedChild]);

  const fetchRewards = async () => {
    if (!selectedChild) return;

    const supabase = createBrowserClient();
    const { data, error } = await supabase
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
      .eq('child_id', selectedChild.id)
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) {
      toast({
        title: 'Error al cargar recompensas',
        description: 'No se pudieron cargar las recompensas',
        variant: 'destructive',
      });
    } else {
      // Procesar recompensas para determinar si ya fueron canjeadas
      const processedRewards = data?.map(reward => {
        const hasBeenClaimed = reward.reward_claims && reward.reward_claims.length > 0;
        return {
          ...reward,
          has_been_claimed: hasBeenClaimed,
          can_redeem: !hasBeenClaimed && childPoints >= reward.points_required,
        };
      }) || [];
      
      setRewards(processedRewards);
    }

    setLoading(false);
  };

  const fetchChildPoints = async () => {
    if (!selectedChild) return;

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('children')
      .select('points_balance')
      .eq('id', selectedChild.id)
      .single();

    if (error) {
      console.error('Error al obtener puntos del niño:', error);
    } else {
      setChildPoints(data?.points_balance || 0);
    }
  };

  const handleClaimReward = async (rewardId: string, rewardTitle: string, pointsRequired: number) => {
    if (!selectedChild) return;
    
    if (childPoints < pointsRequired) {
      toast({
        title: 'Puntos insuficientes',
        description: `Necesitas ${pointsRequired} puntos para canjear esta recompensa. Tienes ${childPoints} puntos.`,
        variant: 'destructive',
      });
      return;
    }

    setClaimingReward(true);
    
    try {
      const response = await fetch('/api/reward-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reward_id: rewardId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al canjear recompensa');
      }

      const result = await response.json();
      
      toast({
        title: '¡Recompensa canjeada!',
        description: `Has canjeado "${rewardTitle}" correctamente. Tu nuevo saldo es ${result.new_balance} puntos.`,
        variant: 'success',
      });

      // Actualizar el saldo de puntos y la lista de recompensas
      setChildPoints(result.new_balance);
      setRewards(prev => prev.map(reward =>
        reward.id === rewardId
          ? { ...reward, has_been_claimed: true, can_redeem: false }
          : reward
      ));

    } catch (error) {
      console.error('Error al canjear recompensa:', error);
      toast({
        title: 'Error al canjear recompensa',
        description: 'No se pudo canjear la recompensa. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setClaimingReward(false);
    }
  };

  const handleDelete = async (rewardId: string) => {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) {
      toast({
        title: 'Error al eliminar recompensa',
        description: 'No se pudo eliminar la recompensa',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Recompensa eliminada',
        description: 'La recompensa ha sido eliminada correctamente',
        variant: 'success',
      });
      setRewards(rewards.filter((reward) => reward.id !== rewardId));
    }
  };
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-8'>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900'>
              Recompensas de {selectedChild?.name}
            </h2>
            <p className='text-gray-600 mt-2'>
              Gestiona las recompensas disponibles para motivar y celebrar logros
            </p>
            {selectedChild && (
              <div className="mt-2 flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-semibold text-gray-700">
                  Saldo actual: {childPoints} puntos
                </span>
              </div>
            )}
          </div>
          <Link href='/rewards/new' className='hidden md:inline-flex'>
            <Button>
              <Plus className='h-5 w-5 mr-2' />
              Nueva Recompensa
            </Button>
          </Link>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className='text-center py-12'>
          <div className='mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6'>
            <Trophy className='h-12 w-12 text-gray-400' />
          </div>
          <h3 className='text-2xl font-bold text-gray-900 mb-4'>
            No hay recompensas
          </h3>
          <p className='text-gray-600 mb-8'>
            Crea tu primera recompensa para motivar y celebrar los logros.
          </p>
          <Link href='/rewards/new'>
            <Button size='lg'>
              <Plus className='h-5 w-5 mr-2' />
              Crear primera recompensa
            </Button>
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24'>
          {rewards.map((reward) => (
            <Card key={reward.id} className='hover:shadow-lg transition-shadow'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Gift className='h-5 w-5 text-green-600' />
                    <span className='text-lg font-semibold'>
                      {reward.title}
                    </span>
                  </div>
                  <div className='flex space-x-2'>
                    <Link href={`/rewards/${reward.id}/edit`}>
                      <Button variant='outline' size='sm'>
                        <Edit className='h-4 w-4' />
                      </Button>
                    </Link>
                    <AlertModal
                      title='Eliminar recompensa'
                      description='¿Estas seguro de que quieres eliminar esta recompensa?'
                      onClick={() => handleDelete(reward.id)}
                      actionText='Eliminar'
                      className='bg-red-600 hover:bg-red-700'
                    >
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </AlertModal>
                  </div>
                </div>
                {reward.description && (
                  <CardDescription>{reward.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      {reward.has_been_claimed ? (
                        <>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          <Badge variant='outline' className='text-green-600 border-green-600'>
                            Canjeada
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Star className='h-4 w-4 text-yellow-500' />
                          <span className='text-sm font-medium'>
                            {reward.points_required} puntos
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {reward.description && (
                    <CardDescription>{reward.description}</CardDescription>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className='w-full'>Canjear recompensa</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {/* Botón Flotante para Móvil */}
      <div className='md:hidden'>
        <Link href='/rewards/new'>
          <Button
            size='icon'
            className='fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40'
          >
            <Plus className='h-6 w-6' />
            <span className='sr-only'>Agregar recompensa</span>
          </Button>
        </Link>
      </div>
    </>
  );
}
