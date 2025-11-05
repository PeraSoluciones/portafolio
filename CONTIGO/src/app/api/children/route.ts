import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Para cada niño, obtener su balance de puntos
    const childrenWithPoints = await Promise.all(
      (data || []).map(async (child) => {
        const { data: balanceData, error: balanceError } = await supabase
          .from('children')
          .select('points_balance')
          .eq('id', child.id)
          .single();

        return {
          ...child,
          points_balance: balanceData?.points_balance || 0,
        };
      })
    );

    return NextResponse.json(childrenWithPoints);
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
    const { name, birth_date, adhd_type, avatar_url } = body;

    if (!name || !birth_date || !adhd_type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('children')
      .insert([
        {
          parent_id: user.id,
          name,
          birth_date,
          adhd_type,
          avatar_url: avatar_url || null,
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