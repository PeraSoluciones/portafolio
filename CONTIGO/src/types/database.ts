export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  birth_date: string;
  avatar_url?: string;
  adhd_type: 'INATTENTIVE' | 'HYPERACTIVE' | 'COMBINED';
  points_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  child_id: string;
  title: string;
  description?: string;
  time: string;
  days: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  child_id: string;
  title: string;
  description?: string;
  category: 'SLEEP' | 'NUTRITION' | 'EXERCISE' | 'HYGIENE' | 'SOCIAL' | 'ORGANIZATION';
  target_frequency: number;
  unit: string;
  points_value: number;
  created_at: string;
  updated_at: string;
}

export interface HabitRecord {
  id: string;
  habit_id: string;
  date: string;
  value: number;
  notes?: string;
  created_at: string;
}

export interface Behavior {
  id: string;
  child_id: string;
  title: string;
  description?: string;
  type: 'POSITIVE' | 'NEGATIVE';
  points_value: number;
  created_at: string;
  updated_at: string;
}

export interface BehaviorRecord {
  id: string;
  behavior_id: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface Reward {
  id: string;
  child_id: string;
  title: string;
  description?: string;
  points_required: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardClaim {
  id: string;
  reward_id: string;
  claimed_at: string;
  notes?: string;
}

export interface Resource {
  id: string;
  title: string;
  content: string;
  category: 'ROUTINES' | 'HABITS' | 'BEHAVIOR' | 'EMOTIONAL' | 'EDUCATIONAL';
  type: 'ARTICLE' | 'VIDEO' | 'TIP' | 'AUDIO';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Nuevas interfaces para el sistema de puntos

export interface PointsTransaction {
  id: string;
  child_id: string;
  transaction_type: 'BEHAVIOR' | 'HABIT' | 'ROUTINE' | 'REWARD_REDEMPTION' | 'ADJUSTMENT';
  related_id?: string;
  points: number;
  description: string;
  balance_after: number;
  created_at: string;
}

export interface RoutineHabit {
  id: string;
  routine_id: string;
  habit_id: string;
  points_value: number;
  is_required: boolean;
  created_at: string;
}

// Tipos extendidos para consultas complejas

export interface ChildWithPoints extends Child {
  recent_transactions: PointsTransaction[];
  available_rewards: Reward[];
}

export interface RoutineWithHabits extends Routine {
  routine_habits: (RoutineHabit & {
    habit: Habit;
  })[];
}

export interface PointsHistory {
  transactions: PointsTransaction[];
  total_earned: number;
  total_spent: number;
  current_balance: number;
}

export interface PointsSummary {
  current_balance: number;
  earned_this_week: number;
  earned_this_month: number;
  spent_this_month: number;
  recent_transactions: PointsTransaction[];
}

// Tipos para formularios y filtros
export type PointsHistoryFilterValues = {
  child_id: string;
  start_date?: string;
  end_date?: string;
  transaction_type?: 'BEHAVIOR' | 'HABIT' | 'ROUTINE' | 'REWARD_REDEMPTION' | 'ADJUSTMENT';
  limit?: number;
};

export type PointsSummaryValues = {
  child_id: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
};

export type PointsAdjustmentFormValues = {
  child_id: string;
  points: number;
  description: string;
};