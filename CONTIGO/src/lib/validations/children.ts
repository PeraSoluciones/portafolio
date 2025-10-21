import * as z from 'zod';

export const childSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  birth_date: z.string().min(1, { message: 'La fecha de nacimiento es requerida' }),
  adhd_type: z.enum(['INATTENTIVE', 'HYPERACTIVE', 'COMBINED']),
});