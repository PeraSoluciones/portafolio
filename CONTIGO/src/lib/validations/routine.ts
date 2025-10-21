import { z } from "zod";

export const createRoutineSchema = z.object({
  title: z.string()
    .min(1, "El título es requerido")
    .min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  time: z.string()
    .min(1, "La hora es requerida"),
  days: z.array(z.string())
    .min(1, "Debe seleccionar al menos un día")
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;