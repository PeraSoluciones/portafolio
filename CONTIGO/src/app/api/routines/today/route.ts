import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/routines/today
 *
 * Obtiene las rutinas programadas para hoy con su estado de completitud real
 *
 * Query params:
 * - child_id: UUID del niño
 *
 * Response:
 * {
 *   data: [
 *     {
 *       id: UUID,
 *       title: string,
 *       description: string,
 *       time: string,
 *       completion_threshold: number,
 *       routine_points: number,
 *       total_habits: number,
 *       completion: {
 *         completion_percentage: number,
 *         completed_habits: number,
 *         total_habits: number,
 *         points_earned: number
 *       } | null,
 *       isCompleted: boolean
 *     }
 *   ]
 * }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');

  if (!childId) {
    return NextResponse.json(
      { error: 'child_id is required' },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];

  // Obtener día de la semana en formato que usa la BD
  const dayNames = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  const dayOfWeek = dayNames[new Date().getDay()];

  try {
    // Obtener rutinas activas programadas para hoy
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select(
        `
        id,
        title,
        description,
        time,
        days,
        completion_threshold,
        routine_points,
        requires_sequence
      `
      )
      .eq('child_id', childId)
      .eq('is_active', true)
      .contains('days', [dayOfWeek]);

    if (routinesError) throw routinesError;

    if (!routines || routines.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const routineIds = routines.map((r) => r.id);

    // Obtener completitud de hoy para estas rutinas
    const { data: completions, error: completionsError } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('child_id', childId)
      .eq('completion_date', today)
      .in('routine_id', routineIds);

    if (completionsError) throw completionsError;

    // Obtener conteo de hábitos por rutina
    const { data: habitCounts, error: habitsError } = await supabase
      .from('routine_habits')
      .select('routine_id, habit_id')
      .in('routine_id', routineIds);

    if (habitsError) throw habitsError;

    // Calcular total de hábitos por rutina
    const habitCountMap =
      habitCounts?.reduce((acc, item) => {
        acc[item.routine_id] = (acc[item.routine_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    // Combinar datos
    const routinesWithCompletion = routines.map((routine) => {
      const completion = completions?.find((c) => c.routine_id === routine.id);
      const totalHabits = habitCountMap[routine.id] || 0;

      return {
        ...routine,
        total_habits: totalHabits,
        completion: completion || null,
        isCompleted: completion
          ? completion.completion_percentage >= routine.completion_threshold
          : false,
      };
    });

    return NextResponse.json({ data: routinesWithCompletion });
  } catch (error: any) {
    console.error('Error fetching routines for today:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch routines' },
      { status: 500 }
    );
  }
}
