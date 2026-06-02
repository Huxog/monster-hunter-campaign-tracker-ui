import { z } from 'zod';

export const questCreateSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign'),
  monsterId: z.string().uuid('Invalid monster'),
  hunterIds: z.array(z.string().uuid()).min(1, 'Select at least one hunter'),
  outcome: z.enum(['success', 'failure', 'abandoned']).nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

export const questUpdateSchema = z.object({
  campaignId: z.string().uuid().optional(),
  monsterId: z.string().uuid().optional(),
  hunterIds: z.array(z.string().uuid()).optional(),
  outcome: z.enum(['success', 'failure', 'abandoned']).nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

export type QuestCreateInput = z.infer<typeof questCreateSchema>;
export type QuestUpdateInput = z.infer<typeof questUpdateSchema>;
