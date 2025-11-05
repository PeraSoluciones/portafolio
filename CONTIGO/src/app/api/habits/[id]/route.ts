import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { habitSchema } from '@/lib/validations/habit';
import { z } from 'zod';

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

    const { data, error } = await supabase
      .from('habits')
      .select(`
        *,
        children!inner(parent_id)
      `)
      .eq('id', params.id)
      .eq('children.parent_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    
    // Validar parcialmente solo los campos que se están actualizando
    const updateSchema = habitSchema.partial();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { title, description, category, target_frequency, unit, points_value } = validationResult.data;

    // Verificar que el hábito pertenece a un hijo del usuario
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select(`
        *,
        children!inner(parent_id)
      `)
      .eq('id', params.id)
      .eq('children.parent_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('habits')
      .update({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(target_frequency !== undefined && { target_frequency }),
        ...(unit !== undefined && { unit }),
        ...(points_value !== undefined && { points_value }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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

    // Verificar que el hábito pertenece a un hijo del usuario
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select(`
        *,
        children!inner(parent_id)
      `)
      .eq('id', params.id)
      .eq('children.parent_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Hábito eliminado correctamente' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}