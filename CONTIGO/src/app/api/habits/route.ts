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
        { error: 'Se requiere child_id' },
        { status: 400 }
      );
    }

    // Verificar que el hijo pertenece al usuario
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', user.id)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: true });

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { child_id, title, description, category, target_frequency, unit, points_value } = body;

    if (!child_id || !title || !category || !target_frequency || !unit || points_value === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el hijo pertenece al usuario
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id')
      .eq('id', child_id)
      .eq('parent_id', user.id)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          child_id,
          title,
          description,
          category,
          target_frequency: parseInt(target_frequency),
          unit,
          points_value: parseInt(points_value),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}