export const STAR_VALUES = [1, 2, 3, 4, 5] as const;
export type Stars = (typeof STAR_VALUES)[number];

export const ELEMENTAL_TYPES = [
  'Fire',
  'Water',
  'Thunder',
  'Ice',
  'Dragon',
] as const;
export type ElementalType = (typeof ELEMENTAL_TYPES)[number];

export const AILMENT_TYPES = [
  'Poison',
  'Paralysis',
  'Sleep',
  'Stun',
  'Blast',
] as const;
export type AilmentType = (typeof AILMENT_TYPES)[number];

export type WeaknessScale = 0 | 1 | 2 | 3;

export interface ElementalWeaknesses {
  Fire: WeaknessScale;
  Water: WeaknessScale;
  Thunder: WeaknessScale;
  Ice: WeaknessScale;
  Dragon: WeaknessScale;
}

export interface AilmentWeaknesses {
  Poison: WeaknessScale;
  Paralysis: WeaknessScale;
  Sleep: WeaknessScale;
  Stun: WeaknessScale;
  Blast: WeaknessScale;
}

export interface Monster {
  id: string;
  name: string;
  description: string | null;
  stars: Stars;
  elementalWeaknesses: ElementalWeaknesses;
  ailmentWeaknesses: AilmentWeaknesses;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  // Eager-loaded on detail
  materials?: MonsterMaterialSummary[];
}

export interface MonsterMaterialSummary {
  id: string;
  name: string;
}
