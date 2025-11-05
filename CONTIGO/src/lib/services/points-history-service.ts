import { z } from 'zod';
import { PointsTransaction } from '@/types/database';

// Interfaz para la respuesta del endpoint /api/points
export interface PointsHistoryResponse {
  child: {
    id: string;
    name: string;
  };
  balance: number;
  stats: {
    total_earned: number;
    total_spent: number;
    current_balance: number;
    habits_completed: number;
    behaviors_recorded: number;
    rewards_claimed: number;
  };
  transactions: (PointsTransaction & {
    related_type: string;
    related_title: string;
  })[];
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

/**
 * Obtiene el historial de transacciones de puntos de un niño desde el endpoint /api/points
 */
export async function fetchPointsHistory(
  childId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PointsHistoryResponse> {
  const params = new URLSearchParams({
    child_id: childId,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`/api/points?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Para obtener siempre los datos más recientes
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener el historial de puntos');
  }

  const data = await response.json();
  
  // Validar la respuesta con Zod
  const pointsHistorySchema = z.object({
    child: z.object({
      id: z.string(),
      name: z.string(),
    }),
    balance: z.number(),
    stats: z.object({
      total_earned: z.number(),
      total_spent: z.number(),
      current_balance: z.number(),
      habits_completed: z.number(),
      behaviors_recorded: z.number(),
      rewards_claimed: z.number(),
    }),
    transactions: z.array(z.object({
      id: z.string(),
      child_id: z.string(),
      transaction_type: z.enum(['BEHAVIOR', 'HABIT', 'ROUTINE', 'REWARD_REDEMPTION', 'ADJUSTMENT']),
      related_id: z.string().optional(),
      points: z.number(),
      description: z.string(),
      balance_after: z.number(),
      created_at: z.string(),
      related_type: z.string(),
      related_title: z.string(),
    })),
    pagination: z.object({
      limit: z.number(),
      offset: z.number(),
      has_more: z.boolean(),
    }),
  });

  return pointsHistorySchema.parse(data);
}

/**
 * Obtiene más transacciones (para paginación infinita)
 */
export async function fetchMorePointsHistory(
  childId: string,
  currentTransactions: PointsHistoryResponse['transactions'],
  limit: number = 20
): Promise<PointsHistoryResponse['transactions']> {
  // Calcular el offset basado en las transacciones actuales
  const offset = currentTransactions.length;
  
  try {
    const response = await fetchPointsHistory(childId, limit, offset);
    return [...currentTransactions, ...response.transactions];
  } catch (error) {
    console.error('Error fetching more points history:', error);
    // Si hay error, devolvemos las transacciones actuales
    return currentTransactions;
  }
}

/**
 * Formatea una transacción para mostrarla en la interfaz
 */
export function formatTransactionForDisplay(transaction: PointsHistoryResponse['transactions'][0]) {
  const isPositive = transaction.points > 0;
  const isNegative = transaction.points < 0;
  
  // Determinar el icono según el tipo de transacción
  let icon = '🔄'; // Por defecto para ajustes
  let typeLabel = transaction.related_type;
  
  switch (transaction.transaction_type) {
    case 'BEHAVIOR':
      icon = isPositive ? '😊' : '😔';
      typeLabel = isPositive ? 'Comportamiento positivo' : 'Comportamiento a mejorar';
      break;
    case 'HABIT':
      icon = '✅';
      typeLabel = 'Hábito completado';
      break;
    case 'ROUTINE':
      icon = '📋';
      typeLabel = 'Rutina completada';
      break;
    case 'REWARD_REDEMPTION':
      icon = '🎁';
      typeLabel = 'Recompensa canjeada';
      break;
    case 'ADJUSTMENT':
      icon = '⚙️';
      typeLabel = 'Ajuste manual';
      break;
  }
  
  return {
    ...transaction,
    isPositive,
    isNegative,
    icon,
    typeLabel,
    formattedPoints: isPositive ? `+${transaction.points}` : `${transaction.points}`,
    formattedDate: new Date(transaction.created_at).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}