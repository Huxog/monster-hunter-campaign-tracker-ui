import type { WeaponClass, ElementalType, Weapon } from '../weapons/types';
import type { Equipment } from '../equipment/types';

export interface Hunter {
  id: string;
  playerName: string;
  hunterName: string;
  campaignId: string;
  class: WeaponClass | null;
  helmetId: string | null;
  vestId: string | null;
  trousersId: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional — present on detail view
  campaign?: HunterCampaignSummary;
  helmet?: HunterEquipmentSummary;
  vest?: HunterEquipmentSummary;
  trousers?: HunterEquipmentSummary;
  weapon?: HunterWeaponSummary;
  quests?: HunterQuestSummary[];
  loot?: HunterLootEntry[];
  inventoryWeapons?: Weapon[];
  inventoryEquipment?: Equipment[];
}

export interface HunterCampaignSummary {
  id: string;
  name: string;
  teamName: string;
}

export interface HunterEquipmentSummary {
  id: string;
  name: string;
  type: 'helmet' | 'vest' | 'trouser';
  armor: number | null;
  imagePath?: string | null;
}

export interface HunterWeaponSummary {
  id: string;
  name: string;
  class: WeaponClass;
  element: ElementalType;
  imagePath?: string | null;
}

export interface HunterQuestSummary {
  id: string;
  outcome: 'success' | 'failure' | 'abandoned' | null;
  completedAt: string | null;
}

export interface HunterLootEntry {
  id: string;
  name: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}
