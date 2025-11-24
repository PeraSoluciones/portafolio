import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Esquema de validación para actualizar asignación de hábito a rutina
const updateRoutineHabitSchema = z.object({
  points_value: z.number().int().min(0).optional(),
  is_required: z.boolean().optional(),
});

// GET - Obtener una asignación específica de hábito a rutina
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('routine_habits')
      .select(
        `
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
      `
      )
      .eq('id', params.id)
      .eq('routines.children.parent_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Asignación no encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Formatear los datos para una mejor estructura en el frontend
    const formattedData = {
      id: data.id,
      routine_id: data.routine_id,
      habit_id: data.habit_id,
      points_value: data.points_value,
      is_required: data.is_required,
      created_at: data.created_at,
      routine: {
        id: data.routines.id,
        title: data.routines.title,
        child_id: data.routines.child_id,
      },
      habit: {
        id: data.habits.id,
        title: data.habits.title,
        category: data.habits.category,
        target_frequency: data.habits.target_frequency,
        unit: data.habits.unit,
        child_id: data.habits.child_id,
      },
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una asignación de hábito a rutina
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la asignación existe y pertenece al usuario
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from('routine_habits')
      .select(
        `
        id,
        routine_id,
        habit_id,
        routines!inner(
          id,
          title,
          child_id,
          children!inner(parent_id)
        ),
        habits!inner(
          id,
          title,
          child_id
        )
      `
      )
      .eq('id', params.id)
      .eq('routines.children.parent_id', user.id)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateRoutineHabitSchema.parse(body);

    // Actualizar la asignación
    const { data, error } = await supabase
      .from('routine_habits')
      .update({
        points_value: validatedData.points_value,
        is_required: validatedData.is_required,
      })
      .eq('id', params.id)
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

    return NextResponse.json(data);
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

// DELETE - Eliminar una asignación de hábito a rutina
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la asignación existe y pertenece al usuario
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from('routine_habits')
      .select(
        `
        id,
        routine_id,
        habit_id,
        routines!inner(
          id,
          title,
          child_id,
          children!inner(parent_id)
        )
      `
      )
      .eq('id', params.id)
      .eq('routines.children.parent_id', user.id)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Asignación no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Eliminar la asignación
    const { error } = await supabase
      .from('routine_habits')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Asignación eliminada correctamente' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
