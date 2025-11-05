import { z } from "zod";

export const habitRecordSchema = z.object({
  habit_id: z.string()
    .uuid({ message: "ID de hábito inválido" })
    .nonempty({ message: "El ID del hábito es obligatorio" }),
  date: z.string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, { message: "Fecha inválida" })
    .transform((val) => new Date(val).toISOString().split('T')[0]),
  value: z.string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), {
      message: "El valor debe ser un número válido.",
    })
    .refine((val) => val >= 0, {
      message: "El valor no puede ser negativo.",
    }),
  notes: z.string().optional(),
});

export const habitRecordUpdateSchema = z.object({
  value: z.string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), {
      message: "El valor debe ser un número válido.",
    })
    .refine((val) => val >= 0, {
      message: "El valor no puede ser negativo.",
    }),
  notes: z.string().optional(),
});

export const habitRecordFilterSchema = z.object({
  habit_id: z.string().uuid().optional(),
  child_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.string().transform((val) => Number(val)).optional(),
});

export type HabitRecordFormValues = z.infer<typeof habitRecordSchema>;
export type HabitRecordUpdateValues = z.infer<typeof habitRecordUpdateSchema>;
export type HabitRecordFilterValues = z.infer<typeof habitRecordFilterSchema>;