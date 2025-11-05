import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Esquema de validación para consulta
const querySchema = z.object({
  child_id: z.string().uuid(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
});

// GET - Obtener información de puntos de un niño
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { child_id, limit = 50, offset = 0 } = querySchema.parse({
      child_id: searchParams.get('child_id'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

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

    // Obtener el balance actual del niño
    const { data: balanceData, error: balanceError } = await supabase
      .from('children')
      .select('points_balance')
      .eq('id', child_id)
      .single();

    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 500 });
    }

    // Obtener el historial de transacciones
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('points_transactions')
      .select(`
        id,
        transaction_type,
        related_id,
        points,
        description,
        balance_after,
        created_at
      `)
      .eq('child_id', child_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      return NextResponse.json({ error: transactionsError.message }, { status: 500 });
    }

    // Enriquecer los datos de transacciones con información relacionada
    const enrichedTransactions = transactionsData?.map(transaction => {
      let relatedTitle = '';
      let relatedType = '';

      switch (transaction.transaction_type) {
        case 'BEHAVIOR':
          relatedType = 'Comportamiento';
          break;
        case 'HABIT':
          relatedType = 'Hábito';
          break;
        case 'REWARD_REDEMPTION':
          relatedType = 'Recompensa';
          break;
        case 'ROUTINE':
          relatedType = 'Rutina';
          break;
        case 'ADJUSTMENT':
          relatedType = 'Ajuste';
          break;
        default:
          relatedType = 'Transacción';
      }

      return {
        ...transaction,
        related_type: relatedType,
        related_title: relatedTitle,
      };
    });

    // Calcular estadísticas
    const stats = {
      total_earned: 0,
      total_spent: 0,
      current_balance: balanceData?.points_balance || 0,
      habits_completed: 0,
      behaviors_recorded: 0,
      rewards_claimed: 0,
    };

    if (transactionsData) {
      stats.total_earned = transactionsData
        .filter(t => t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);
      
      stats.total_spent = Math.abs(transactionsData
        .filter(t => t.points < 0)
        .reduce((sum, t) => sum + t.points, 0));
      
      stats.habits_completed = transactionsData
        .filter(t => t.transaction_type === 'HABIT').length;
      
      stats.behaviors_recorded = transactionsData
        .filter(t => t.transaction_type === 'BEHAVIOR').length;
      
      stats.rewards_claimed = transactionsData
        .filter(t => t.transaction_type === 'REWARD_REDEMPTION').length;
    }

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
      },
      balance: balanceData?.points_balance || 0,
      stats,
      transactions: enrichedTransactions || [],
      pagination: {
        limit,
        offset,
        has_more: (transactionsData?.length || 0) === limit,
      },
    });
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

// POST - Realizar un ajuste manual de puntos (solo para padres)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { child_id, points, description } = body;

    if (!child_id || points === undefined || points === null) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: child_id, points' },
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

    // Llamar a la función de ajuste de puntos
    const { data, error } = await supabase.rpc('adjust_child_points', {
      p_child_id: child_id,
      p_points: points,
      p_description: description || 'Ajuste manual de puntos',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // El resultado de adjust_child_points es una tabla con los campos:
    // transaction_id, new_balance, success, message
    const result = data[0];

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      transaction_id: result.transaction_id,
      new_balance: result.new_balance,
      message: result.message,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}