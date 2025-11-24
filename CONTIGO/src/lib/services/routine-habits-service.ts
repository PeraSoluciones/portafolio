import { createBrowserClient } from '@/lib/supabase/client';
import { Habit } from '@/types/database';
import { RoutineHabitAssignment } from '@/types/routine-habits';

/**
 * Obtiene los hábitos asignados a una rutina específica
 */
export async function getAssignedHabits(
  routineId: string
): Promise<RoutineHabitAssignment[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('routine_habits')
    .select(
      `
      *,
      habits!inner(
        id,
        title,
        description,
        category,
        target_frequency,
        unit,
        points_value,
        child_id,
        created_at,
        updated_at
      )
    `
    )
    .eq('routine_id', routineId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching assigned habits:', error);
    throw new Error('No se pudieron cargar los hábitos asignados');
  }

  // Transformar los datos al formato esperado
  return (data || []).map((item) => ({
    id: item.id,
    routine_id: item.routine_id,
    habit_id: item.habit_id,
    points_value: item.points_value,
    is_required: item.is_required,
    created_at: item.created_at,
    habit: item.habits as Habit,
  }));
}

/**
 * Obtiene todos los hábitos disponibles para un niño específico
 */
export async function getAvailableHabits(childId: string): Promise<Habit[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('child_id', childId)
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching available habits:', error);
    throw new Error('No se pudieron cargar los hábitos disponibles');
  }

  return data || [];
}

/**
 * Asigna un hábito a una rutina
 */
export async function assignHabitToRoutine(
  routineId: string,
  habitId: string,
  pointsValue: number = 0,
  isRequired: boolean = true
): Promise<RoutineHabitAssignment> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from('routine_habits')
    .insert([
      {
        routine_id: routineId,
        habit_id: habitId,
        points_value: pointsValue,
        is_required: isRequired,
      },
    ])
    .select(
      `
      *,
      habits!inner(
        id,
        title,
        description,
        category,
        target_frequency,
        unit,
        points_value,
        child_id,
        created_at,
        updated_at
      )
    `
    )
    .single();

  if (error) {
    console.error('Error assigning habit to routine:', error);
    throw new Error('No se pudo asignar el hábito a la rutina');
  }

  // Transformar los datos al formato esperado
  return {
    id: data.id,
    routine_id: data.routine_id,
    habit_id: data.habit_id,
    points_value: data.points_value,
    is_required: data.is_required,
    created_at: data.created_at,
    habit: data.habits as Habit,
  };
}

/**
 * Elimina una asignación de hábito a rutina
 */
export async function removeHabitFromRoutine(
  assignmentId: string
): Promise<void> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from('routine_habits')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error removing habit from routine:', error);
    throw new Error('No se pudo eliminar el hábito de la rutina');
  }
}

/**
 * Obtiene los hábitos disponibles filtrando los que ya están asignados a la rutina
 */
export async function getUnassignedHabits(
  childId: string,
  routineId: string
): Promise<Habit[]> {
  // Primero obtener los hábitos asignados
  const assignedHabits = await getAssignedHabits(routineId);
  const assignedHabitIds = assignedHabits.map((ah) => ah.habit_id);

  // Luego obtener todos los hábitos y filtrar los no asignados
  const allHabits = await getAvailableHabits(childId);

  return allHabits.filter((habit) => !assignedHabitIds.includes(habit.id));
}
