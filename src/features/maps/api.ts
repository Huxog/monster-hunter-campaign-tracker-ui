import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { GameMap } from './types';
import type { MapCreateInput, MapUpdateInput } from './schemas';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const mapKeys = {
  all: ['maps'] as const,
  list: (params?: { page?: number }) =>
    [...mapKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...mapKeys.all, 'detail', id] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function mapsQueryOptions(params?: { page?: number }) {
  const qs = params?.page && params.page > 1 ? `?page=${params.page}` : '';
  return queryOptions({
    queryKey: mapKeys.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<GameMap>>(`/maps${qs}`),
  });
}

export function mapQueryOptions(id: string) {
  return queryOptions({
    queryKey: mapKeys.detail(id),
    queryFn: () =>
      apiClient.get<{ data: GameMap }>(`/maps/${id}`).then((r) => r.data),
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMaps(params?: { page?: number }) {
  return useQuery(mapsQueryOptions(params));
}

export function useMap(id: string) {
  return useQuery(mapQueryOptions(id));
}

export function useCreateMap() {
  return useMutation({
    mutationFn: (input: MapCreateInput) =>
      apiClient.post<{ data: GameMap }>('/maps', input).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mapKeys.all });
      toast.success('Map created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateMap(id: string) {
  return useMutation({
    mutationFn: (input: MapUpdateInput) =>
      apiClient
        .patch<{ data: GameMap }>(`/maps/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mapKeys.all });
      toast.success('Map updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteMap() {
  return useMutation({
    mutationFn: (mapId: string) => apiClient.delete<void>(`/maps/${mapId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mapKeys.all });
      toast.success('Map deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
