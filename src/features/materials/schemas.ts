import { z } from 'zod';

export const materialCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const materialUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type MaterialCreateInput = z.infer<typeof materialCreateSchema>;
export type MaterialUpdateInput = z.infer<typeof materialUpdateSchema>;
