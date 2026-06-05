import { z } from 'zod';
import { WEAPON_CLASSES } from '../weapons/types';

export const createInvitationSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const acceptInvitationSchema = z.object({
  playerName: z.string().min(1, 'Player name is required'),
  hunterName: z.string().min(1, 'Hunter name is required'),
  class: z.enum(WEAPON_CLASSES, { required_error: 'Weapon class is required' }),
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
