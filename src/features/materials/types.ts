export interface Material {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Eager-loaded on detail
  weapons?: MaterialWeaponSummary[];
  equipment?: MaterialEquipmentSummary[];
  monsters?: MaterialMonsterSummary[];
}

export interface MaterialWeaponSummary {
  id: string;
  name: string;
  class: string;
  element: string;
}

export interface MaterialEquipmentSummary {
  id: string;
  name: string;
  type: string;
  class: string;
}

export interface MaterialMonsterSummary {
  id: string;
  name: string;
  stars: number;
  imagePath: string | null;
}
