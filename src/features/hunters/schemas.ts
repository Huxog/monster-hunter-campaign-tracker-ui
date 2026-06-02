import { z } from 'zod';

export const hunterCreateSchema = z.object({
  playerName: z.string().min(1, 'Player name is required'),
  hunterName: z.string().min(1, 'Hunter name is required'),
  campaignId: z.string().uuid('Invalid campaign'),
});

export type HunterCreateInput = z.infer<typeof hunterCreateSchema>;

export const hunterUpdateSchema = z.object({
  playerName: z.string().min(1).optional(),
  hunterName: z.string().min(1).optional(),
});

export type HunterUpdateInput = z.infer<typeof hunterUpdateSchema>;

export const addLootSchema = z.object({
  materialId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export type AddLootInput = z.infer<typeof addLootSchema>;

export const updateLootSchema = z.object({
  quantity: z.number().int().min(1),
});

export type UpdateLootInput = z.infer<typeof updateLootSchema>;

export const craftSchema = z.object({
  craftableType: z.enum(['weapon', 'equipment']),
  craftableId: z.string().uuid(),
});

export type CraftInput = z.infer<typeof craftSchema>;
