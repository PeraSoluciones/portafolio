import { z } from "zod";

export const habitSchema = z.object({
  title: z.string()
    .min(3, {
      message: "El título debe tener al menos 3 caracteres.",
    })
    .nonempty({
      message: "El título es obligatorio.",
    }),
  description: z.string().optional(),
  category: z.string()
    .nonempty({
      message: "La categoría es obligatoria.",
    }),
  target_frequency: z.string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), {
      message: "La frecuencia objetivo debe ser un número válido.",
    })
    .refine((val) => val > 0, {
      message: "La frecuencia objetivo debe ser un número positivo.",
    }),
  unit: z.string()
    .nonempty({
      message: "La unidad es obligatoria.",
    }),
});

export type HabitFormValues = z.infer<typeof habitSchema>;