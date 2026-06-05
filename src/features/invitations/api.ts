import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/lib/apiClient';
import type { InvitationPreview, CreatedInvitation } from './types';
import type { CreateInvitationInput, AcceptInvitationInput } from './schemas';
import type { Hunter } from '../hunters/types';

export function invitationPreviewOptions(token: string) {
  return {
    queryKey: ['invitations', token],
    queryFn: () =>
      apiClient.get<{ data: InvitationPreview }>(`/invitations/${token}`),
    retry: false,
  };
}

export function useInvitationPreview(token: string) {
  return useQuery(invitationPreviewOptions(token));
}

export function useCreateInvitation(campaignId: string) {
  return useMutation({
    mutationFn: (data: CreateInvitationInput) =>
      apiClient.post<{ data: CreatedInvitation }>(
        `/campaigns/${campaignId}/invitations`,
        data.email ? { email: data.email } : {},
      ),
  });
}

export function useAcceptInvitation(token: string) {
  return useMutation({
    mutationFn: (data: AcceptInvitationInput) =>
      apiClient.post<{ data: Hunter }>(`/invitations/${token}/accept`, data),
  });
}
