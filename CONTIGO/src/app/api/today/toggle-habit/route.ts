import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { formatedCurrentDate } from '@/lib/utils';

const toggleHabitSchema = z.object({
  habit_id: z.uuid('ID de hábito inválido'),
  is_completed: z.boolean(),
  child_id: z.uuid('ID de hijo inválido'),
});

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
    const validationResult = toggleHabitSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { habit_id, is_completed, child_id } = validationResult.data;

    // Verificar que el usuario es padre del niño
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name, parent_id')
      .eq('id', child_id)
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

    // Verificar que el hábito pertenece al niño
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, title, child_id')
      .eq('id', habit_id)
      .eq('child_id', child_id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json(
        {
          error: 'El hábito especificado no existe o no pertenece a este niño',
        },
        { status: 404 }
      );
    }

    const todayDate = formatedCurrentDate();

    if (is_completed) {
      // Marcar como completado (crear o actualizar registro)
      const { data: existingRecord, error: existingError } = await supabase
        .from('habit_records')
        .select('*')
        .eq('habit_id', habit_id)
        .eq('date', todayDate)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing habit record:', existingError);
      }

      if (existingRecord) {
        // Ya existe un registro, actualizarlo
        const { data: updatedRecord, error: updateError } = await supabase
          .from('habit_records')
          .update({
            value: 1,
            notes: 'Completado desde la vista de hoy',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({
          success: true,
          data: {
            record: updatedRecord,
            habit: {
              id: habit.id,
              title: habit.title,
            },
            action: 'updated',
          },
        });
      } else {
        // Crear nuevo registro
        const { data: newRecord, error: insertError } = await supabase
          .from('habit_records')
          .insert({
            habit_id: habit_id,
            date: todayDate,
            value: 1,
            notes: 'Completado desde la vista de hoy',
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Obtener puntos asignados a este hábito en rutinas
        const { data: pointsData } = await supabase
          .from('routine_habits')
          .select('points_value')
          .eq('habit_id', habit_id);

        const totalPoints =
          pointsData?.reduce((sum, item) => sum + item.points_value, 0) || 0;

        return NextResponse.json({
          success: true,
          data: {
            record: newRecord,
            habit: {
              id: habit.id,
              title: habit.title,
            },
            pointsEarned: totalPoints,
            action: 'created',
          },
        });
      }
    } else {
      // Desmarcar como completado (eliminar registro)
      const { data: existingRecord, error: fetchError } = await supabase
        .from('habit_records')
        .select('*')
        .eq('habit_id', habit_id)
        .eq('date', todayDate)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No existe el registro, no hay nada que hacer
          return NextResponse.json({
            success: true,
            data: {
              habit: {
                id: habit.id,
                title: habit.title,
              },
              action: 'none',
            },
          });
        }
        throw fetchError;
      }

      const { error: deleteError } = await supabase
        .from('habit_records')
        .delete()
        .eq('id', existingRecord.id);

      if (deleteError) {
        throw deleteError;
      }

      // Obtener puntos que se otorgaron por este hábito
      const { data: pointsData } = await supabase
        .from('routine_habits')
        .select('points_value')
        .eq('habit_id', habit_id);

      const totalPoints =
        pointsData?.reduce((sum, item) => sum + item.points_value, 0) || 0;

      return NextResponse.json({
        success: true,
        data: {
          habit: {
            id: habit.id,
            title: habit.title,
          },
          pointsLost: totalPoints,
          action: 'deleted',
        },
      });
    }
  } catch (error) {
    console.error('Error toggling habit:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
