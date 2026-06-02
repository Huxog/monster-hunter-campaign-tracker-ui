import { z } from 'zod';

export const mapCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type MapCreateInput = z.infer<typeof mapCreateSchema>;

export const mapUpdateSchema = mapCreateSchema.partial();

export type MapUpdateInput = z.infer<typeof mapUpdateSchema>;
