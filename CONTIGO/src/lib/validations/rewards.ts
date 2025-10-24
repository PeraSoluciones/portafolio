import { z } from 'zod';

export const rewardSchema = z.object({
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
  points_required: z.coerce
    .number()
    .int({ message: 'Los puntos deben ser un número entero.' })
    .positive({ message: 'Los puntos deben ser un número positivo.' }),
});

export type RewardFormValues = z.infer<typeof rewardSchema>;
