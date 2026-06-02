export type QuestOutcome = 'success' | 'failure' | 'abandoned';

export interface QuestMonsterSummary {
  id: string;
  name: string;
  imagePath: string | null;
  stars: number;
}

export interface QuestHunterSummary {
  id: string;
  hunterName: string;
  playerName: string;
  class: string | null;
}

export interface Quest {
  id: string;
  campaignId: string;
  monsterId: string;
  outcome: QuestOutcome | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  monster?: QuestMonsterSummary;
  hunters?: QuestHunterSummary[];
}
