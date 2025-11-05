import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { habitRecordUpdateSchema } from '@/lib/validations/habit-record';

// GET - Obtener un registro de hábito específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: record, error } = await supabase
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
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!record) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene permiso para ver este registro
    const recordData = record as any;
    if (recordData.habits.children.parent_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un registro de hábito
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el registro existe y pertenece a un hijo del usuario
    const { data: existingRecord, error: fetchError } = await supabase
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
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const recordData = existingRecord as any;
    if (recordData.habits.children.parent_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = habitRecordUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Nota: No actualizamos el date, ya que eso podría crear duplicados
    // Si se necesita cambiar la fecha, se debe crear un nuevo registro
    const { data: updatedRecord, error: updateError } = await supabase
      .from('habit_records')
      .update({
        value: validatedData.value,
        notes: validatedData.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un registro de hábito
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el registro existe y pertenece a un hijo del usuario
    const { data: existingRecord, error: fetchError } = await supabase
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
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const recordData = existingRecord as any;
    if (recordData.habits.children.parent_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('habit_records')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Registro eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}