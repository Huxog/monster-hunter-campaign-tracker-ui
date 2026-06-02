export interface MapSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface HunterSummary {
  id: string;
  hunterName: string;
  playerName: string;
  class: string | null;
}

export interface QuestSummary {
  id: string;
  monsterId: string;
  outcome: 'success' | 'failure' | 'abandoned' | null;
  completedAt: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  teamName: string;
  mapId: string | null;
  createdAt: string;
  updatedAt: string;
  map?: MapSummary;
  hunters?: HunterSummary[];
  quests?: QuestSummary[];
}
