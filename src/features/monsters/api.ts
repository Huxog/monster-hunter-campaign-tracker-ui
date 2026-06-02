import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { Monster } from './types';
import type { MonsterCreateInput, MonsterUpdateInput } from './schemas';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const monsterKeys = {
  all: ['monsters'] as const,
  list: (params?: { stars?: number; page?: number }) =>
    [...monsterKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...monsterKeys.all, 'detail', id] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function monstersQueryOptions(params?: { stars?: number; page?: number }) {
  const search = new URLSearchParams();
  if (params?.stars) search.set('stars', String(params.stars));
  if (params?.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();

  return queryOptions({
    queryKey: monsterKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Monster>>(`/monsters${qs ? `?${qs}` : ''}`),
    staleTime: 60 * 60 * 1000,
  });
}

export function monsterQueryOptions(id: string) {
  return queryOptions({
    queryKey: monsterKeys.detail(id),
    queryFn: () =>
      apiClient.get<{ data: Monster }>(`/monsters/${id}`).then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMonsters(params?: { stars?: number; page?: number }) {
  return useQuery(monstersQueryOptions(params));
}

export function monstersAllQueryOptions() {
  return queryOptions({
    queryKey: monsterKeys.list({ page: 0 }),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Monster>>('/monsters?per_page=0'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMonstersAll() {
  return useQuery(monstersAllQueryOptions());
}

export function useMonster(id: string) {
  return useQuery(monsterQueryOptions(id));
}

export function useCreateMonster() {
  return useMutation({
    mutationFn: (input: MonsterCreateInput) =>
      apiClient
        .post<{ data: Monster }>('/monsters', input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: monsterKeys.all });
      toast.success('Monster created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateMonster(id: string) {
  return useMutation({
    mutationFn: (input: MonsterUpdateInput) =>
      apiClient
        .patch<{ data: Monster }>(`/monsters/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: monsterKeys.all });
      toast.success('Monster updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteMonster() {
  return useMutation({
    mutationFn: (monsterId: string) =>
      apiClient.delete<void>(`/monsters/${monsterId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: monsterKeys.all });
      toast.success('Monster deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
