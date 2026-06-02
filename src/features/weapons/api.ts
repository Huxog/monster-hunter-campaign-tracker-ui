import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { Weapon, WeaponClass, ElementalType } from './types';
import type { WeaponCreateInput, WeaponUpdateInput } from './schemas';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const weaponKeys = {
  all: ['weapons'] as const,
  list: (params?: { class?: WeaponClass; element?: ElementalType; page?: number }) =>
    [...weaponKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...weaponKeys.all, 'detail', id] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function weaponsQueryOptions(params?: {
  class?: WeaponClass;
  element?: ElementalType;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params?.class) search.set('class', params.class);
  if (params?.element) search.set('element', params.element);
  if (params?.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();

  return queryOptions({
    queryKey: weaponKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Weapon>>(`/weapons${qs ? `?${qs}` : ''}`),
    staleTime: 60 * 60 * 1000,
  });
}

export function weaponQueryOptions(id: string) {
  return queryOptions({
    queryKey: weaponKeys.detail(id),
    queryFn: () =>
      apiClient.get<{ data: Weapon }>(`/weapons/${id}`).then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useWeapons(params?: {
  class?: WeaponClass;
  element?: ElementalType;
  page?: number;
}) {
  return useQuery(weaponsQueryOptions(params));
}

export function weaponsAllQueryOptions() {
  return queryOptions({
    queryKey: weaponKeys.list({ page: 0 }),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Weapon>>('/weapons?per_page=0'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useWeaponsAll() {
  return useQuery(weaponsAllQueryOptions());
}

export function useWeapon(id: string) {
  return useQuery(weaponQueryOptions(id));
}

export function useCreateWeapon() {
  return useMutation({
    mutationFn: (input: WeaponCreateInput) =>
      apiClient
        .post<{ data: Weapon }>('/weapons', input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: weaponKeys.all });
      toast.success('Weapon created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateWeapon(id: string) {
  return useMutation({
    mutationFn: (input: WeaponUpdateInput) =>
      apiClient
        .patch<{ data: Weapon }>(`/weapons/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: weaponKeys.all });
      toast.success('Weapon updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteWeapon() {
  return useMutation({
    mutationFn: (weaponId: string) =>
      apiClient.delete<void>(`/weapons/${weaponId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: weaponKeys.all });
      toast.success('Weapon deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
