import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('child_id');

    if (!childId) {
      return NextResponse.json(
        { error: 'El ID del hijo es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es padre del niño
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name, parent_id, adhd_type, points_balance, birth_date')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      return NextResponse.json(
        { error: 'El hijo especificado no existe' },
        { status: 404 }
      );
    }

    if (child.parent_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener el día de la semana actual
    const today = new Date().getDay();
    const dayNames = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const todayName = dayNames[today];
    const todayDate = new Date().toISOString().split('T')[0];

    // Obtener rutinas de hoy con sus hábitos asignados
    const { data: routinesData, error: routinesError } = await supabase
      .from('routines')
      .select(`
        *,
        routine_habits (
          id,
          points_value,
          is_required,
          habits (
            id,
            title,
            description,
            category,
            target_frequency,
            unit
          )
        )
      `)
      .eq('child_id', childId)
      .eq('is_active', true)
      .contains('days', [todayName])
      .order('time', { ascending: true });

    if (routinesError) {
      console.error('Error fetching routines:', routinesError);
      throw routinesError;
    }

    // Obtener los IDs de todos los hábitos para verificar su estado
    const habitIds = routinesData
      ?.flatMap(routine => routine.routine_habits)
      ?.map(rh => rh.habits.id) || [];

    let habitRecords: any[] = [];
    
    if (habitIds.length > 0) {
      // Verificar qué hábitos ya están completados hoy
      const { data: records, error: recordsError } = await supabase
        .from('habit_records')
        .select('*')
        .in('habit_id', habitIds)
        .eq('date', todayDate);

      if (recordsError) {
        console.error('Error fetching habit records:', recordsError);
        throw recordsError;
      }

      habitRecords = records || [];
    }

    // Estructurar los datos para el frontend
    const formattedRoutines = routinesData?.map(routine => {
      const habitsWithStatus = routine.routine_habits.map(rh => {
        const record = habitRecords.find(hr => hr.habit_id === rh.habits.id);
        
        return {
          id: rh.id,
          habitId: rh.habits.id,
          title: rh.habits.title,
          description: rh.habits.description,
          category: rh.habits.category,
          targetFrequency: rh.habits.target_frequency,
          unit: rh.habits.unit,
          pointsValue: rh.points_value,
          isRequired: rh.is_required,
          isCompleted: !!record,
          recordId: record?.id,
          recordValue: record?.value,
          recordNotes: record?.notes,
        };
      });

      return {
        id: routine.id,
        title: routine.title,
        description: routine.description,
        time: routine.time,
        days: routine.days,
        isActive: routine.is_active,
        createdAt: routine.created_at,
        updatedAt: routine.updated_at,
        habits: habitsWithStatus,
        completedHabitsCount: habitsWithStatus.filter(h => h.isCompleted).length,
        totalHabitsCount: habitsWithStatus.length,
      };
    }) || [];

    // Calcular estadísticas del día
    const allHabits = formattedRoutines.flatMap(r => r.habits);
    const completedHabits = allHabits.filter(h => h.isCompleted);
    const totalPointsEarned = completedHabits.reduce(
      (total, habit) => total + (habit.pointsValue || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        child: {
          id: child.id,
          name: child.name,
          adhd_type: child.adhd_type,
          points_balance: child.points_balance,
          birth_date: child.birth_date,
        },
        routines: formattedRoutines,
        statistics: {
          totalRoutines: formattedRoutines.length,
          totalHabits: allHabits.length,
          completedHabits: completedHabits.length,
          progressPercentage: allHabits.length > 0 
            ? Math.round((completedHabits.length / allHabits.length) * 100)
            : 0,
          totalPointsEarned,
        },
        todayInfo: {
          date: todayDate,
          dayName: todayName,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching today data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}