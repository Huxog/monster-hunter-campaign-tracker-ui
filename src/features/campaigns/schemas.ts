import { z } from 'zod';

export const campaignCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  teamName: z.string().min(1, 'Team name is required'),
  mapId: z.string().uuid().nullable().optional(),
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

export const campaignUpdateSchema = campaignCreateSchema.partial();

export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
