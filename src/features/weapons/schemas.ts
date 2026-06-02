import { z } from 'zod';
import { WEAPON_CLASSES, ELEMENTAL_TYPES } from './types';

const recipeEntrySchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const weaponCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  class: z.enum(WEAPON_CLASSES),
  element: z.enum(ELEMENTAL_TYPES).optional(),
  damage: z
    .tuple([
      z.number().int().min(0, 'Must be 0 or more'),
      z.number().int().min(0, 'Must be 0 or more'),
      z.number().int().min(0, 'Must be 0 or more'),
      z.number().int().min(0, 'Must be 0 or more'),
    ])
    .optional(),
  imagePath: z.string().url('Must be a valid URL').optional(),
  materials: z.array(recipeEntrySchema).optional(),
});

export const weaponUpdateSchema = weaponCreateSchema.partial();

export type WeaponCreateInput = z.infer<typeof weaponCreateSchema>;
export type WeaponUpdateInput = z.infer<typeof weaponUpdateSchema>;
