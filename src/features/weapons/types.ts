export const WEAPON_CLASSES = [
  'Bow',
  'Great Sword',
  'Dual Blades',
  'Long Sword',
  'Sword and Shield',
  'Hammer',
  'Lance',
  'Gun Lance',
  'Switch Axe',
  'Charge Blade',
  'Insect Glaive',
  'Light Bowgun',
  'Heavy Bowgun',
  'Hunting Horn',
] as const;
export type WeaponClass = (typeof WEAPON_CLASSES)[number];

export const ELEMENTAL_TYPES = [
  'Fire',
  'Water',
  'Thunder',
  'Ice',
  'Dragon',
  'None',
] as const;
export type ElementalType = (typeof ELEMENTAL_TYPES)[number];

export interface Weapon {
  id: string;
  name: string;
  class: WeaponClass;
  element: ElementalType;
  /** [count of 1-dmg cards, 2-dmg cards, 3-dmg cards, 4-dmg cards] */
  damage: [number, number, number, number];
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  // Eager-loaded on detail
  hunter?: { id: string; hunterName: string };
  materials?: WeaponMaterialSummary[];
}

export interface WeaponMaterialSummary {
  id: string;
  name: string;
  quantity: number;
}
