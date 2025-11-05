import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Esquema de validación para crear un reclamo de recompensa
const createClaimSchema = z.object({
  reward_id: z.string().uuid(),
  notes: z.string().optional(),
});

// POST - Crear un nuevo reclamo de recompensa
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { reward_id, notes } = createClaimSchema.parse(body);

    // Obtener información de la recompensa para verificar que pertenece al usuario
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select(`
        id,
        child_id,
        title,
        points_required,
        children!inner(
          id,
          parent_id,
          points_balance
        )
      `)
      .eq('id', reward_id)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Recompensa no encontrada' }, { status: 404 });
    }

    // Verificar que el hijo pertenece al usuario
    const childData = reward.children as any;
    if (childData.parent_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar que el niño tiene suficientes puntos
    if (childData.points_balance < reward.points_required) {
      return NextResponse.json(
        { error: 'Puntos insuficientes para canjear esta recompensa' },
        { status: 400 }
      );
    }

    // Verificar que la recompensa no ha sido canjeada previamente
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('reward_id', reward_id)
      .maybeSingle();

    if (claimCheckError) {
      return NextResponse.json({ error: claimCheckError.message }, { status: 500 });
    }

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Esta recompensa ya ha sido canjeada' },
        { status: 400 }
      );
    }

    // Crear el reclamo de recompensa (el trigger automáticamente descontará los puntos)
    const { data: claim, error: claimError } = await supabase
      .from('reward_claims')
      .insert([
        {
          reward_id,
          notes,
        },
      ])
      .select(`
        id,
        reward_id,
        claimed_at,
        notes,
        rewards!inner(
          id,
          title,
          points_required
        )
      `)
      .single();

    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    // Obtener el nuevo saldo de puntos del niño
    const { data: updatedChild, error: balanceError } = await supabase
      .from('children')
      .select('points_balance')
      .eq('id', reward.child_id)
      .single();

    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 500 });
    }

    return NextResponse.json({
      claim: {
        id: claim.id,
        reward_id: claim.reward_id,
        claimed_at: claim.claimed_at,
        notes: claim.notes,
        reward: {
          id: (claim as any).rewards.id,
          title: (claim as any).rewards.title,
          points_required: (claim as any).rewards.points_required,
        },
      },
      new_balance: updatedChild.points_balance,
    }, { status: 201 });
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

// GET - Obtener reclamos de recompensas de un niño
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const child_id = searchParams.get('child_id');

    if (!child_id) {
      return NextResponse.json(
        { error: 'Se requiere child_id' },
        { status: 400 }
      );
    }

    // Verificar que el hijo pertenece al usuario
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('id, name')
      .eq('id', child_id)
      .eq('parent_id', user.id)
      .single();

    if (childError || !child) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener los reclamos de recompensas del niño
    const { data: claims, error: claimsError } = await supabase
      .from('reward_claims')
      .select(`
        id,
        reward_id,
        claimed_at,
        notes,
        rewards!inner(
          id,
          title,
          description,
          points_required,
          is_active
        )
      `)
      .eq('rewards.child_id', child_id)
      .order('claimed_at', { ascending: false });

    if (claimsError) {
      return NextResponse.json({ error: claimsError.message }, { status: 500 });
    }

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
      },
      claims: claims || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}