import { type User, type Child } from './database';
export * from './database';

export interface AppState {
  user: User | null;
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;
}

export interface RoutineFormData {
  title: string;
  description?: string;
  time: string;
  days: string[];
}

export interface HabitFormData {
  title: string;
  description?: string;
  category: 'SLEEP' | 'NUTRITION' | 'EXERCISE' | 'HYGIENE' | 'SOCIAL';
  target_frequency: number;
  unit: string;
}

export interface BehaviorFormData {
  title: string;
  description?: string;
  type: 'POSITIVE' | 'NEGATIVE';
  points: number;
}

export interface RewardFormData {
  title: string;
  description?: string;
  points_required: number;
}

export interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
}