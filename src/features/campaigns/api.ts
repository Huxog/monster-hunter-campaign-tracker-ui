import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { Campaign } from './types';
import type { CampaignCreateInput, CampaignUpdateInput } from './schemas';
import type { Hunter, HunterLootEntry } from '../hunters/types';
import type { Quest } from '../quests/types';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (params?: { mapId?: string; page?: number }) =>
    [...campaignKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
  hunters: (id: string) => [...campaignKeys.detail(id), 'hunters'] as const,
  quests: (id: string) => [...campaignKeys.detail(id), 'quests'] as const,
  loot: (id: string) => [...campaignKeys.detail(id), 'loot'] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function campaignsQueryOptions(params?: { mapId?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params?.mapId) search.set('mapId', params.mapId);
  if (params?.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();

  return queryOptions({
    queryKey: campaignKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Campaign>>(`/campaigns${qs ? `?${qs}` : ''}`),
  });
}

export function campaignQueryOptions(id: string) {
  return queryOptions({
    queryKey: campaignKeys.detail(id),
    queryFn: () =>
      apiClient
        .get<{ data: Campaign }>(`/campaigns/${id}`)
        .then((r) => r.data),
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCampaigns(params?: { mapId?: string; page?: number }) {
  return useQuery(campaignsQueryOptions(params));
}

export function campaignHuntersQueryOptions(campaignId: string) {
  return queryOptions({
    queryKey: campaignKeys.hunters(campaignId),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Hunter>>(`/campaigns/${campaignId}/hunters`),
  });
}

export function campaignQuestsQueryOptions(campaignId: string) {
  return queryOptions({
    queryKey: campaignKeys.quests(campaignId),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Quest>>(`/campaigns/${campaignId}/quests`),
  });
}

export function useCampaign(id: string) {
  return useQuery(campaignQueryOptions(id));
}

export function useCampaignHunters(campaignId: string, enabled = true) {
  return useQuery({ ...campaignHuntersQueryOptions(campaignId), enabled });
}

export function useCampaignQuests(campaignId: string, enabled = true) {
  return useQuery({ ...campaignQuestsQueryOptions(campaignId), enabled });
}

export function campaignLootQueryOptions(campaignId: string) {
  return queryOptions({
    queryKey: campaignKeys.loot(campaignId),
    queryFn: () =>
      apiClient.get<{ data: HunterLootEntry[] }>(`/campaigns/${campaignId}/loot`),
  });
}

export function useCampaignLoot(campaignId: string, enabled = true) {
  return useQuery({ ...campaignLootQueryOptions(campaignId), enabled });
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: (input: CampaignCreateInput) =>
      apiClient
        .post<{ data: Campaign }>('/campaigns', input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success('Campaign created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateCampaign(id: string) {
  return useMutation({
    mutationFn: (input: CampaignUpdateInput) =>
      apiClient
        .patch<{ data: Campaign }>(`/campaigns/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success('Campaign updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteCampaign() {
  return useMutation({
    mutationFn: (campaignId: string) =>
      apiClient.delete<void>(`/campaigns/${campaignId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success('Campaign deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
