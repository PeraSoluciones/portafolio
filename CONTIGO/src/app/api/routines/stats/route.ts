import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/routines/stats
 *
 * Obtiene estadísticas de rutinas para un niño
 *
 * Query params:
 * - child_id: UUID del niño (requerido)
 * - routine_id: UUID de la rutina (opcional, para stats de rutina específica)
 * - days: número de días hacia atrás (default: 7)
 *
 * Response:
 * {
 *   data: {
 *     streak: number,              // Racha actual (solo si routine_id está presente)
 *     weeklyCompletions: [...],    // Completitud de últimos N días
 *     totalRoutines: number,       // Total de rutinas activas
 *     completedToday: number,      // Rutinas completadas hoy
 *     averageCompletion: number    // Promedio de completitud (%)
 *   }
 * }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');
  const routineId = searchParams.get('routine_id');
  const days = parseInt(searchParams.get('days') || '7', 10);

  if (!childId) {
    return NextResponse.json(
      { error: 'child_id is required' },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();

  try {
    const stats: any = {};

    // Si se proporciona routine_id, calcular racha
    if (routineId) {
      const { data: streakData, error: streakError } = await supabase.rpc(
        'get_routine_streak',
        {
          p_routine_id: routineId,
          p_child_id: childId,
        }
      );

      if (streakError) {
        console.error('Error fetching streak:', streakError);
        stats.streak = 0;
      } else {
        stats.streak = streakData || 0;
      }
    }

    // Obtener completitud de últimos N días
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const startDate = daysAgo.toISOString().split('T')[0];

    const completionsQuery = supabase
      .from('routine_completions')
      .select('*')
      .eq('child_id', childId)
      .gte('completion_date', startDate)
      .order('completion_date', { ascending: false });

    if (routineId) {
      completionsQuery.eq('routine_id', routineId);
    }

    const { data: weeklyData, error: weeklyError } = await completionsQuery;

    if (weeklyError) throw weeklyError;

    stats.weeklyCompletions = weeklyData || [];

    // Obtener total de rutinas activas
    const { count: totalRoutines, error: countError } = await supabase
      .from('routines')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('is_active', true);

    if (countError) throw countError;

    stats.totalRoutines = totalRoutines || 0;

    // Obtener rutinas completadas hoy
    const today = new Date().toISOString().split('T')[0];

    const { data: todayCompletions, error: todayError } = await supabase
      .from('routine_completions')
      .select(
        'routine_id, completion_percentage, routines!inner(completion_threshold)'
      )
      .eq('child_id', childId)
      .eq('completion_date', today);

    if (todayError) throw todayError;

    // Contar rutinas que alcanzaron su umbral
    const completedToday =
      todayCompletions?.filter((c) => {
        const threshold = (c.routines as any)?.completion_threshold || 100;
        return c.completion_percentage >= threshold;
      }).length || 0;

    stats.completedToday = completedToday;

    // Calcular promedio de completitud
    if (weeklyData && weeklyData.length > 0) {
      const avgCompletion =
        weeklyData.reduce((sum, item) => sum + item.completion_percentage, 0) /
        weeklyData.length;
      stats.averageCompletion = Math.round(avgCompletion);
    } else {
      stats.averageCompletion = 0;
    }

    return NextResponse.json({ data: stats });
  } catch (error: any) {
    console.error('Error fetching routine stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch routine stats' },
      { status: 500 }
    );
  }
}
