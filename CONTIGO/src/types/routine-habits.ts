import { Habit } from './database';

// Tipo extendido para una asignación de hábito a rutina con información completa
export interface RoutineHabitAssignment {
  id: string;
  routine_id: string;
  habit_id: string;
  points_value: number;
  is_required: boolean;
  created_at: string;
  habit: Habit;
}

// Tipo para el formulario de asignación de hábitos a rutinas
export interface AssignHabitFormValues {
  habit_id: string;
  points_value: number;
  is_required: boolean;
}

// Tipo para la lista de hábitos disponibles con estado de selección
export interface HabitWithSelection extends Habit {
  selected: boolean;
  assigned?: boolean; // Para marcar si ya está asignado a la rutina actual
}

// Tipo para el estado del componente de gestión de hábitos en una rutina
export interface RoutineHabitsState {
  assignedHabits: RoutineHabitAssignment[];
  availableHabits: HabitWithSelection[];
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  showAddHabitModal: boolean;
}