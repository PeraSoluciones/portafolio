import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Esquema de validación para consulta
const querySchema = z.object({
  child_id: z.string().uuid(),
  period: z.enum(['week', 'month', 'year']).optional().default('month'),
});

// GET - Obtener estadísticas detalladas de puntos de un niño
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { child_id, period } = querySchema.parse({
      child_id: searchParams.get('child_id'),
      period: searchParams.get('period') || 'month',
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

    // Calcular el rango de fechas según el período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Obtener estadísticas generales usando la función de PostgreSQL
    const { data: generalStats, error: statsError } = await supabase.rpc(
      'get_child_points_stats',
      { p_child_id: child_id }
    );

    if (statsError) {
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // Obtener transacciones del período especificado
    const { data: periodTransactions, error: transactionsError } = await supabase
      .from('points_transactions')
      .select(`
        id,
        transaction_type,
        points,
        description,
        created_at
      `)
      .eq('child_id', child_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (transactionsError) {
      return NextResponse.json({ error: transactionsError.message }, { status: 500 });
    }

    // Calcular estadísticas del período
    const periodStats = {
      total_earned: 0,
      total_spent: 0,
      net_gain: 0,
      transactions_count: 0,
      by_type: {} as Record<string, { count: number; points: number }>,
      daily_breakdown: [] as Array<{ date: string; earned: number; spent: number; net: number }>,
    };

    if (periodTransactions) {
      periodStats.transactions_count = periodTransactions.length;
      
      // Agrupar por tipo de transacción
      periodTransactions.forEach(transaction => {
        const type = transaction.transaction_type;
        if (!periodStats.by_type[type]) {
          periodStats.by_type[type] = { count: 0, points: 0 };
        }
        periodStats.by_type[type].count += 1;
        periodStats.by_type[type].points += transaction.points;
        
        if (transaction.points > 0) {
          periodStats.total_earned += transaction.points;
        } else {
          periodStats.total_spent += Math.abs(transaction.points);
        }
      });
      
      periodStats.net_gain = periodStats.total_earned - periodStats.total_spent;
      
      // Desglose diario
      const dailyMap = new Map<string, { earned: number; spent: number }>();
      
      periodTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toISOString().split('T')[0];
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { earned: 0, spent: 0 });
        }
        
        const dayData = dailyMap.get(date)!;
        if (transaction.points > 0) {
          dayData.earned += transaction.points;
        } else {
          dayData.spent += Math.abs(transaction.points);
        }
      });
      
      periodStats.daily_breakdown = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          earned: data.earned,
          spent: data.spent,
          net: data.earned - data.spent,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Obtener recompensas alcanzables
    const { data: availableRewards, error: rewardsError } = await supabase.rpc(
      'get_next_achievable_reward',
      { p_child_id: child_id }
    );

    if (rewardsError) {
      return NextResponse.json({ error: rewardsError.message }, { status: 500 });
    }

    // Obtener tendencias (comparación con período anterior)
    let trends: {
      earned_change: number;
      spent_change: number;
      earned_percentage: number;
      spent_percentage: number;
    } | null = null;
    try {
      const previousStartDate = new Date(startDate);
      const endDate = new Date(startDate);
      
      switch (period) {
        case 'week':
          previousStartDate.setDate(previousStartDate.getDate() - 7);
          break;
        case 'month':
          previousStartDate.setMonth(previousStartDate.getMonth() - 1);
          break;
        case 'year':
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
          break;
      }
      
      const { data: previousTransactions } = await supabase
        .from('points_transactions')
        .select('points')
        .eq('child_id', child_id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());
      
      if (previousTransactions && previousTransactions.length > 0) {
        const previousEarned = previousTransactions
          .filter(t => t.points > 0)
          .reduce((sum, t) => sum + t.points, 0);
        
        const previousSpent = Math.abs(previousTransactions
          .filter(t => t.points < 0)
          .reduce((sum, t) => sum + t.points, 0));
        
        trends = {
          earned_change: periodStats.total_earned - previousEarned,
          spent_change: periodStats.total_spent - previousSpent,
          earned_percentage: previousEarned > 0 
            ? ((periodStats.total_earned - previousEarned) / previousEarned) * 100 
            : 0,
          spent_percentage: previousSpent > 0 
            ? ((periodStats.total_spent - previousSpent) / previousSpent) * 100 
            : 0,
        };
      }
    } catch (error) {
      // No incluir tendencias si hay error
      console.error('Error calculating trends:', error);
    }

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
      },
      period,
      general_stats: generalStats[0] || {},
      period_stats: periodStats,
      available_rewards: availableRewards || [],
      trends,
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