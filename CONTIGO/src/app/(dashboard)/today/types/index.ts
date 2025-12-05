// Tipos compartidos para la página /today

export interface HabitState {
  routineHabitId: string; // ID único de routine_habits
  habitId: string; // ID del hábito (para API)
  routineId: string; // ID de la rutina (para API)
  isCompleted: boolean;
  pointsEarned?: number;
  recordId?: string;
}

export interface RoutineWithHabits {
  id: string;
  title: string;
  description?: string; // Optional to match Routine type
  time: string;
  days: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  habits: HabitState[];
}

export interface PointsAnimationState {
  show: boolean;
  points: number;
  habitTitle: string;
}
