import { z } from 'zod';

export const behaviorSchema = z.object({
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

export type BehaviorFormValues = z.infer<typeof behaviorSchema>;