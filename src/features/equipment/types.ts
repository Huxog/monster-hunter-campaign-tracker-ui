import type { WeaponClass } from '../weapons/types';

export const EQUIPMENT_TYPES = ['helmet', 'vest', 'trouser'] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export interface ElementalResistances {
  fire: number;
  ice: number;
  thunder: number;
  water: number;
  dragon: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  class: WeaponClass;
  effect: string | null;
  armor: number | null;
  elementalResistances: ElementalResistances | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  // Eager-loaded on detail
  materials?: EquipmentMaterialSummary[];
}

export interface EquipmentMaterialSummary {
  id: string;
  name: string;
  quantity: number;
}
