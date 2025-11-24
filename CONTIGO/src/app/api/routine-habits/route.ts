import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Esquema de validación para asignar hábitos a rutinas
const routineHabitSchema = z.object({
  routine_id: z.string().uuid(),
  habit_id: z.string().uuid(),
  points_value: z.number().int().min(0).default(0),
  is_required: z.boolean().default(true),
});

// Esquema de validación para consulta
const querySchema = z.object({
  routine_id: z.string().uuid().optional(),
  habit_id: z.string().uuid().optional(),
});

// GET - Obtener las asignaciones de hábitos a rutinas
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { routine_id, habit_id } = querySchema.parse({
      routine_id: searchParams.get('routine_id') || undefined,
      habit_id: searchParams.get('habit_id') || undefined,
    });

    let query = supabase.from('routine_habits').select(`
        *,
        routines!inner(
          id,
          title,
          child_id,
          children!inner(parent_id)
        ),
        habits!inner(
          id,
          title,
          category,
          target_frequency,
          unit,
          child_id
        )
      `);

    // Filtrar por rutina si se proporciona
    if (routine_id) {
      query = query.eq('routine_id', routine_id);
    }

    // Filtrar por hábito si se proporciona
    if (habit_id) {
      query = query.eq('habit_id', habit_id);
    }

    // Filtrar por usuario autenticado
    query = query.eq('routines.children.parent_id', user.id);

    const { data, error } = await query.order('created_at', {
      ascending: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Formatear los datos para una mejor estructura en el frontend
    const formattedData = data?.map((item) => ({
      id: item.id,
      routine_id: item.routine_id,
      habit_id: item.habit_id,
      points_value: item.points_value,
      is_required: item.is_required,
      created_at: item.created_at,
      routine: {
        id: item.routines.id,
        title: item.routines.title,
        child_id: item.routines.child_id,
      },
      habit: {
        id: item.habits.id,
        title: item.habits.title,
        category: item.habits.category,
        target_frequency: item.habits.target_frequency,
        unit: item.habits.unit,
        child_id: item.habits.child_id,
      },
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Asignar un hábito a una rutina
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = routineHabitSchema.parse(body);

    // Verificar que la rutina pertenece a un hijo del usuario
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(
        `
        id,
        title,
        child_id,
        children!inner(parent_id)
      `
      )
      .eq('id', validatedData.routine_id)
      .eq('children.parent_id', user.id)
      .single();

    if (routineError || !routine) {
      return NextResponse.json(
        { error: 'No autorizado para esta rutina' },
        { status: 403 }
      );
    }

    // Verificar que el hábito pertenece al mismo hijo
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, title, child_id')
      .eq('id', validatedData.habit_id)
      .eq('child_id', routine.child_id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json(
        { error: 'El hábito no existe o no pertenece al mismo hijo' },
        { status: 400 }
      );
    }

    // Verificar que la asignación no exista ya
    const { data: existingAssignment } = await supabase
      .from('routine_habits')
      .select('id')
      .eq('routine_id', validatedData.routine_id)
      .eq('habit_id', validatedData.habit_id)
      .single();

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'El hábito ya está asignado a esta rutina' },
        { status: 409 }
      );
    }

    // Crear la asignación
    const { data, error } = await supabase
      .from('routine_habits')
      .insert([
        {
          routine_id: validatedData.routine_id,
          habit_id: validatedData.habit_id,
          points_value: validatedData.points_value,
          is_required: validatedData.is_required,
        },
      ])
      .select(
        `
        *,
        routines(title, child_id),
        habits(title, category, target_frequency, unit, child_id)
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
