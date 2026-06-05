export interface InvitationPreview {
  token: string;
  campaignId: string;
  email: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  campaign: { id: string; name: string };
  invitedBy: { id: string; name: string };
}

export interface CreatedInvitation {
  id: string;
  campaignId: string;
  token: string;
  email: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  campaign: { id: string; name: string };
  invitedBy: { id: string; name: string };
}
