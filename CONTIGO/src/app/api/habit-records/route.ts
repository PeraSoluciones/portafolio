import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { habitRecordSchema, habitRecordFilterSchema } from '@/lib/validations/habit-record';

// GET - Obtener registros de hábitos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habit_id');
    const childId = searchParams.get('child_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = searchParams.get('limit');

    // Validar parámetros de filtro
    const validationResult = habitRecordFilterSchema.safeParse({
      habit_id: habitId,
      child_id: childId,
      start_date: startDate,
      end_date: endDate,
      limit: limit,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    // Construir la consulta
    let query = supabase
      .from('habit_records')
      .select(`
        *,
        habits (
          id,
          title,
          child_id,
          children (
            id,
            name,
            parent_id
          )
        )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.habit_id) {
      query = query.eq('habit_id', filters.habit_id);
    }

    if (filters.child_id) {
      query = query.eq('habits.child_id', filters.child_id);
    }

    if (filters.start_date) {
      query = query.gte('date', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('date', filters.end_date);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Verificar que el usuario tiene permiso para ver estos registros
    if (data && data.length > 0) {
      const firstRecord = data[0] as any;
      const childParentId = firstRecord?.habits?.children?.parent_id;
      
      if (childParentId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo registro de hábito
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = habitRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verificar que el hábito existe y pertenece a un hijo del usuario
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('child_id, children(id, parent_id)')
      .eq('id', validatedData.habit_id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json(
        { error: 'El hábito especificado no existe' },
        { status: 404 }
      );
    }

    const habitData = habit as any;
    if (habitData.children.parent_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar si ya existe un registro para este hábito en esta fecha
    const { data: existingRecord, error: existingError } = await supabase
      .from('habit_records')
      .select('*')
      .eq('habit_id', validatedData.habit_id)
      .eq('date', validatedData.date)
      .single();

    if (existingRecord) {
      // Actualizar el registro existente
      const { data: updatedRecord, error: updateError } = await supabase
        .from('habit_records')
        .update({
          value: validatedData.value,
          notes: validatedData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json(updatedRecord, { status: 200 });
    } else {
      // Crear un nuevo registro
      const { data: newRecord, error: insertError } = await supabase
        .from('habit_records')
        .insert({
          habit_id: validatedData.habit_id,
          date: validatedData.date,
          value: validatedData.value,
          notes: validatedData.notes,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json(newRecord, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}