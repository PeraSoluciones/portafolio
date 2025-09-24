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
  age: number;
  birth_date: string;
  avatar_url?: string;
  adhd_type: 'INATTENTIVE' | 'HYPERACTIVE' | 'COMBINED';
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
  category: 'SLEEP' | 'NUTRITION' | 'EXERCISE' | 'HYGIENE' | 'SOCIAL';
  target_frequency: number;
  unit: string;
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
  points: number;
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
  type: 'ARTICLE' | 'VIDEO' | 'TIP';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}