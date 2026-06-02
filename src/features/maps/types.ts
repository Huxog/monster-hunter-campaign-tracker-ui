export interface GameMap {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  campaigns?: MapCampaignSummary[];
}

export interface MapCampaignSummary {
  id: string;
  name: string;
  teamName: string;
}
