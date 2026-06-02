import { z } from 'zod';
import { WEAPON_CLASSES } from '../weapons/types';
import { EQUIPMENT_TYPES } from './types';

const resistanceValue = z.number().int().min(-5).max(5);

const recipeEntrySchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const equipmentCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(EQUIPMENT_TYPES),
  class: z.enum(WEAPON_CLASSES),
  effect: z.string().optional(),
  armor: z.number().int().min(0).optional(),
  elementalResistances: z
    .object({
      fire: resistanceValue,
      ice: resistanceValue,
      thunder: resistanceValue,
      water: resistanceValue,
      dragon: resistanceValue,
    })
    .optional(),
  imagePath: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().url('Must be a valid URL').optional(),
  ),
  materials: z.array(recipeEntrySchema).optional(),
});

export const equipmentUpdateSchema = equipmentCreateSchema
  .omit({ type: true })
  .partial();

export type EquipmentCreateInput = z.infer<typeof equipmentCreateSchema>;
export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>;
