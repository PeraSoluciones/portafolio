import { z } from 'zod';

// Validación para ajuste manual de puntos
export const pointsAdjustmentSchema = z.object({
  child_id: z.string().uuid({ message: 'ID de niño inválido.' }),
  points: z.coerce
    .number()
    .int({ message: 'Los puntos deben ser un número entero.' })
    .min(-100, { message: 'No se pueden ajustar más de -100 puntos.' })
    .max(100, { message: 'No se pueden ajustar más de 100 puntos.' }),
  description: z
    .string()
    .min(3, { message: 'La descripción debe tener al menos 3 caracteres.' })
    .max(255, { message: 'La descripción no puede tener más de 255 caracteres.' }),
});

// Validación para crear hábitos de rutina con puntos
export const routineHabitSchema = z.object({
  routine_id: z.string().uuid({ message: 'ID de rutina inválido.' }),
  habit_id: z.string().uuid({ message: 'ID de hábito inválido.' }),
  points_value: z.coerce
    .number()
    .int({ message: 'Los puntos deben ser un número entero.' })
    .min(0, { message: 'Los puntos no pueden ser negativos.' })
    .max(20, { message: 'Los puntos no pueden ser mayores a 20.' }),
  is_required: z.boolean().default(true),
});

// Validación para filtros de historial de puntos
export const pointsHistoryFilterSchema = z.object({
  child_id: z.string().uuid({ message: 'ID de niño inválido.' }),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  transaction_type: z.enum([
    'BEHAVIOR', 
    'HABIT', 
    'ROUTINE', 
    'REWARD_REDEMPTION', 
    'ADJUSTMENT'
  ]).optional(),
  limit: z.coerce
    .number()
    .int({ message: 'El límite debe ser un número entero.' })
    .min(1, { message: 'El límite debe ser al menos 1.' })
    .max(100, { message: 'El límite no puede ser mayor a 100.' })
    .default(50),
});

// Validación para el resumen de puntos
export const pointsSummarySchema = z.object({
  child_id: z.string().uuid({ message: 'ID de niño inválido.' }),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

// Tipos inferidos para formularios
export type PointsAdjustmentFormValues = z.infer<typeof pointsAdjustmentSchema>;
export type RoutineHabitFormValues = z.infer<typeof routineHabitSchema>;
export type PointsHistoryFilterValues = z.infer<typeof pointsHistoryFilterSchema>;
export type PointsSummaryValues = z.infer<typeof pointsSummarySchema>;

// Funciones de validación personalizadas

/**
 * Valida si un niño tiene suficientes puntos para una recompensa
 */
export const validateSufficientPoints = (currentBalance: number, requiredPoints: number) => {
  return currentBalance >= requiredPoints;
};

/**
 * Valida si el ajuste de puntos mantendría el saldo no negativo
 */
export const validatePointsAdjustment = (currentBalance: number, adjustment: number) => {
  return (currentBalance + adjustment) >= 0;
};

/**
 * Calcula los puntos finales basados en el tipo de comportamiento
 */
export const calculateBehaviorPoints = (pointsValue: number, behaviorType: 'POSITIVE' | 'NEGATIVE') => {
  return behaviorType === 'POSITIVE' ? pointsValue : -pointsValue;
};

// Esquema para el formulario extendido de comportamiento (con lógica de puntos)
export const extendedBehaviorSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'El título debe tener al menos 3 caracteres.' })
    .max(100, { message: 'El título no puede tener más de 100 caracteres.' }),
  description: z
    .string()
    .max(255, {
      message: 'La descripción no puede tener más de 255 caracteres.',
    })
    .optional(),
  type: z.enum(['POSITIVE', 'NEGATIVE']),
  points_value: z.coerce
    .number()
    .int({ message: 'Los puntos deben ser un número entero.' })
    .positive({ message: 'Los puntos deben ser un número positivo.' }),
});

export type ExtendedBehaviorFormValues = z.infer<typeof extendedBehaviorSchema>;