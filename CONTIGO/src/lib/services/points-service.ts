import { createBrowserClient } from '@/lib/supabase/client';
import { 
  PointsTransaction, 
  PointsHistory, 
  PointsSummary, 
  RoutineHabit,
  Child,
  PointsHistoryFilterValues,
  PointsSummaryValues,
  PointsAdjustmentFormValues
} from '@/types/database';
import { pointsHistoryFilterSchema, pointsSummarySchema, pointsAdjustmentSchema } from '@/lib/validations/points';

/**
 * Obtiene el balance actual de puntos de un niño
 */
export async function getChildPointsBalance(childId: string): Promise<number> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .rpc('get_child_points_balance', { p_child_id: childId });
    
  if (error) {
    console.error('Error getting child points balance:', error);
    throw new Error('No se pudo obtener el balance de puntos');
  }
  
  return data || 0;
}

/**
 * Obtiene el historial de transacciones de puntos de un niño
 */
export async function getChildPointsHistory(
  childId: string, 
  filters?: Partial<PointsHistoryFilterValues>
): Promise<PointsTransaction[]> {
  const supabase = createBrowserClient();
  
  try {
    const validatedFilters = pointsHistoryFilterSchema.parse({
      child_id: childId,
      ...filters
    });
    
    let query = supabase
      .from('points_transactions')
      .select('*')
      .eq('child_id', validatedFilters.child_id)
      .order('created_at', { ascending: false });
    
    if (validatedFilters.start_date) {
      query = query.gte('created_at', validatedFilters.start_date);
    }
    
    if (validatedFilters.end_date) {
      query = query.lte('created_at', validatedFilters.end_date);
    }
    
    if (validatedFilters.transaction_type) {
      query = query.eq('transaction_type', validatedFilters.transaction_type);
    }
    
    const { data, error } = await query.limit(validatedFilters.limit);
    
    if (error) {
      console.error('Error getting points history:', error);
      throw new Error('No se pudo obtener el historial de puntos');
    }
    
    return data || [];
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
}

/**
 * Obtiene un resumen completo de puntos de un niño
 */
export async function getChildPointsSummary(
  childId: string, 
  period: PointsSummaryValues['period'] = 'month'
): Promise<PointsSummary> {
  const supabase = createBrowserClient();
  
  try {
    const validatedValues = pointsSummarySchema.parse({
      child_id: childId,
      period
    });
    
    const now = new Date();
    let startDate: Date;
    
    switch (validatedValues.period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    // Obtener balance actual
    const currentBalance = await getChildPointsBalance(validatedValues.child_id);
    
    // Obtener transacciones del período
    const { data: transactions, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('child_id', validatedValues.child_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting points summary:', error);
      throw new Error('No se pudo obtener el resumen de puntos');
    }
    
    const recentTransactions = transactions || [];
    
    // Calcular estadísticas
    const earnedThisPeriod = recentTransactions
      .filter(t => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);
      
    const spentThisPeriod = Math.abs(
      recentTransactions
        .filter(t => t.points < 0)
        .reduce((sum, t) => sum + t.points, 0)
    );
    
    return {
      current_balance: currentBalance,
      earned_this_week: period === 'week' ? earnedThisPeriod : 
        recentTransactions
          .filter(t => t.points > 0 && new Date(t.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
          .reduce((sum, t) => sum + t.points, 0),
      earned_this_month: period === 'month' ? earnedThisPeriod : 
        recentTransactions
          .filter(t => t.points > 0 && new Date(t.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1))
          .reduce((sum, t) => sum + t.points, 0),
      spent_this_month: period === 'month' ? spentThisPeriod : 
        Math.abs(
          recentTransactions
            .filter(t => t.points < 0 && new Date(t.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1))
            .reduce((sum, t) => sum + t.points, 0)
        ),
      recent_transactions: recentTransactions.slice(0, 10)
    };
  } catch (error) {
    console.error('Error in points summary:', error);
    throw error;
  }
}

/**
 * Realiza un ajuste manual de puntos a un niño
 */
export async function adjustChildPoints(adjustment: PointsAdjustmentFormValues): Promise<void> {
  const supabase = createBrowserClient();
  
  try {
    const validatedAdjustment = pointsAdjustmentSchema.parse(adjustment);
    
    const { error } = await supabase.rpc('adjust_child_points', {
      p_child_id: validatedAdjustment.child_id,
      p_points: validatedAdjustment.points,
      p_description: validatedAdjustment.description
    });
    
    if (error) {
      console.error('Error adjusting child points:', error);
      throw new Error('No se pudo realizar el ajuste de puntos');
    }
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
}

/**
 * Obtiene los hábitos asociados a una rutina
 */
export async function getRoutineHabits(routineId: string): Promise<(RoutineHabit & {
  habit: {
    id: string;
    title: string;
    category: string;
  };
})[]> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('routine_habits')
    .select(`
      *,
      habit:habits (
        id,
        title,
        category
      )
    `)
    .eq('routine_id', routineId);
    
  if (error) {
    console.error('Error getting routine habits:', error);
    throw new Error('No se pudieron obtener los hábitos de la rutina');
  }
  
  return data || [];
}

/**
 * Agrega un hábito a una rutina con puntos
 */
export async function addHabitToRoutine(
  routineId: string, 
  habitId: string, 
  pointsValue: number,
  isRequired: boolean = true
): Promise<RoutineHabit> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('routine_habits')
    .insert({
      routine_id: routineId,
      habit_id: habitId,
      points_value: pointsValue,
      is_required: isRequired
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding habit to routine:', error);
    throw new Error('No se pudo agregar el hábito a la rutina');
  }
  
  return data;
}

/**
 * Actualiza los puntos de un hábito en una rutina
 */
export async function updateRoutineHabitPoints(
  routineHabitId: string, 
  pointsValue: number
): Promise<RoutineHabit> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('routine_habits')
    .update({ points_value: pointsValue })
    .eq('id', routineHabitId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating routine habit points:', error);
    throw new Error('No se pudieron actualizar los puntos del hábito');
  }
  
  return data;
}

/**
 * Elimina un hábito de una rutina
 */
export async function removeHabitFromRoutine(routineHabitId: string): Promise<void> {
  const supabase = createBrowserClient();
  
  const { error } = await supabase
    .from('routine_habits')
    .delete()
    .eq('id', routineHabitId);
    
  if (error) {
    console.error('Error removing habit from routine:', error);
    throw new Error('No se pudo eliminar el hábito de la rutina');
  }
}

/**
 * Verifica si un niño tiene suficientes puntos para una recompensa
 */
export async function canChildClaimReward(childId: string, rewardId: string): Promise<boolean> {
  const supabase = createBrowserClient();
  
  // Obtener los puntos requeridos de la recompensa
  const { data: reward, error: rewardError } = await supabase
    .from('rewards')
    .select('points_required')
    .eq('id', rewardId)
    .single();
    
  if (rewardError || !reward) {
    console.error('Error getting reward:', rewardError);
    throw new Error('No se pudo obtener la información de la recompensa');
  }
  
  // Obtener el balance actual del niño
  const currentBalance = await getChildPointsBalance(childId);
  
  return currentBalance >= reward.points_required;
}

/**
 * Obtiene estadísticas detalladas de puntos para el dashboard
 */
export async function getPointsDashboardData(childId: string): Promise<{
  balance: number;
  earnedThisWeek: number;
  earnedThisMonth: number;
  spentThisMonth: number;
  recentTransactions: PointsTransaction[];
  topEarningBehaviors: Array<{
    title: string;
    totalPoints: number;
    occurrences: number;
  }>;
  redemptionHistory: Array<{
    rewardTitle: string;
    pointsSpent: number;
    claimedAt: string;
  }>;
}> {
  const summary = await getChildPointsSummary(childId, 'month');
  
  // Obtener transacciones detalladas
  const supabase = createBrowserClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const { data: transactions, error } = await supabase
    .from('points_transactions')
    .select(`
      *,
      behaviors!inner (
        title
      ),
      rewards!inner (
        title
      )
    `)
    .eq('child_id', childId)
    .gte('created_at', thirtyDaysAgo.toISOString());
    
  if (error) {
    console.error('Error getting dashboard data:', error);
    throw new Error('No se pudo obtener los datos del dashboard');
  }
  
  const behaviorTransactions = transactions?.filter(t => t.transaction_type === 'BEHAVIOR') || [];
  const rewardTransactions = transactions?.filter(t => t.transaction_type === 'REWARD_REDEMPTION') || [];
  
  // Calcular comportamientos que más puntos generan
  const behaviorStats = behaviorTransactions.reduce((acc, t) => {
    const title = t.behaviors?.title || 'Desconocido';
    if (!acc[title]) {
      acc[title] = { title, totalPoints: 0, occurrences: 0 };
    }
    acc[title].totalPoints += t.points;
    acc[title].occurrences += 1;
    return acc;
  }, {} as Record<string, any>);
  
  const topEarningBehaviors = (Object.values(behaviorStats) as Array<{
    title: string;
    totalPoints: number;
    occurrences: number;
  }>)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);
  
  // Historial de canjes
  const redemptionHistory = rewardTransactions.map(t => ({
    rewardTitle: t.rewards?.title || 'Desconocido',
    pointsSpent: Math.abs(t.points),
    claimedAt: t.created_at
  }));
  
  return {
    balance: summary.current_balance,
    earnedThisWeek: summary.earned_this_week,
    earnedThisMonth: summary.earned_this_month,
    spentThisMonth: summary.spent_this_month,
    recentTransactions: summary.recent_transactions,
    topEarningBehaviors,
    redemptionHistory
  };
}