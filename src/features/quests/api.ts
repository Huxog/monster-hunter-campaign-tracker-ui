import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { Quest, QuestOutcome } from './types';
import type { QuestCreateInput, QuestUpdateInput } from './schemas';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const questKeys = {
  all: ['quests'] as const,
  list: (params?: {
    campaignId?: string;
    monsterId?: string;
    outcome?: QuestOutcome;
    page?: number;
  }) => [...questKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...questKeys.all, 'detail', id] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function questsQueryOptions(params?: {
  campaignId?: string;
  monsterId?: string;
  outcome?: QuestOutcome;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params?.campaignId) search.set('campaignId', params.campaignId);
  if (params?.monsterId) search.set('monsterId', params.monsterId);
  if (params?.outcome) search.set('outcome', params.outcome);
  if (params?.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();

  return queryOptions({
    queryKey: questKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Quest>>(`/quests${qs ? `?${qs}` : ''}`),
  });
}

export function questQueryOptions(id: string) {
  return queryOptions({
    queryKey: questKeys.detail(id),
    queryFn: () =>
      apiClient.get<{ data: Quest }>(`/quests/${id}`).then((r) => r.data),
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useQuests(params?: {
  campaignId?: string;
  monsterId?: string;
  outcome?: QuestOutcome;
  page?: number;
}) {
  return useQuery(questsQueryOptions(params));
}

export function useQuest(id: string) {
  return useQuery(questQueryOptions(id));
}

export function useCreateQuest() {
  return useMutation({
    mutationFn: (input: QuestCreateInput) =>
      apiClient.post<{ data: Quest }>('/quests', input).then((r) => r.data),
    onSuccess: (quest) => {
      void queryClient.invalidateQueries({ queryKey: questKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ['campaigns', 'detail', quest.campaignId, 'quests'],
      });
      toast.success('Quest created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateQuest(id: string) {
  return useMutation({
    mutationFn: (input: QuestUpdateInput) =>
      apiClient.patch<{ data: Quest }>(`/quests/${id}`, input).then((r) => r.data),
    onSuccess: (quest) => {
      void queryClient.invalidateQueries({ queryKey: questKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ['campaigns', 'detail', quest.campaignId, 'quests'],
      });
      toast.success('Quest updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteQuest() {
  return useMutation({
    mutationFn: (questId: string) => apiClient.delete<void>(`/quests/${questId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: questKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Quest deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
