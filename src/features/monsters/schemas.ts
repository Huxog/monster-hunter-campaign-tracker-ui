import { z } from 'zod';

const weaknessScale = z.number().int().min(0).max(3);

export const monsterCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  stars: z.number().int().min(1).max(7),
  imagePath: z.string().optional(),
  elementalWeaknesses: z.object({
    Fire: weaknessScale,
    Water: weaknessScale,
    Thunder: weaknessScale,
    Ice: weaknessScale,
    Dragon: weaknessScale,
  }),
  ailmentWeaknesses: z.object({
    Poison: weaknessScale,
    Paralysis: weaknessScale,
    Sleep: weaknessScale,
    Stun: weaknessScale,
    Blast: weaknessScale,
  }),
  materials: z.array(z.string().uuid()).optional(),
});

export const monsterUpdateSchema = monsterCreateSchema.partial();

export type MonsterCreateInput = z.infer<typeof monsterCreateSchema>;
export type MonsterUpdateInput = z.infer<typeof monsterUpdateSchema>;
