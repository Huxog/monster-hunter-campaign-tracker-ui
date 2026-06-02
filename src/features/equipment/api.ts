import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { Equipment, EquipmentType } from './types';
import type { WeaponClass } from '../weapons/types';
import type { EquipmentCreateInput, EquipmentUpdateInput } from './schemas';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const equipmentKeys = {
  all: ['equipment'] as const,
  list: (params?: { type?: EquipmentType; class?: WeaponClass; page?: number }) =>
    [...equipmentKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...equipmentKeys.all, 'detail', id] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function equipmentListQueryOptions(params?: {
  type?: EquipmentType;
  class?: WeaponClass;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params?.type) search.set('type', params.type);
  if (params?.class) search.set('class', params.class);
  if (params?.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();

  return queryOptions({
    queryKey: equipmentKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Equipment>>(
        `/equipment${qs ? `?${qs}` : ''}`,
      ),
    staleTime: 60 * 60 * 1000,
  });
}

export function equipmentQueryOptions(id: string) {
  return queryOptions({
    queryKey: equipmentKeys.detail(id),
    queryFn: () =>
      apiClient
        .get<{ data: Equipment }>(`/equipment/${id}`)
        .then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useEquipmentList(params?: {
  type?: EquipmentType;
  class?: WeaponClass;
  page?: number;
}) {
  return useQuery(equipmentListQueryOptions(params));
}

export function equipmentAllQueryOptions() {
  return queryOptions({
    queryKey: equipmentKeys.list({ page: 0 }),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Equipment>>('/equipment?per_page=0'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useEquipmentAll() {
  return useQuery(equipmentAllQueryOptions());
}

export function useEquipment(id: string) {
  return useQuery(equipmentQueryOptions(id));
}

export function useCreateEquipment() {
  return useMutation({
    mutationFn: (input: EquipmentCreateInput) =>
      apiClient
        .post<{ data: Equipment }>('/equipment', input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
      toast.success('Equipment created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateEquipment(id: string) {
  return useMutation({
    mutationFn: (input: EquipmentUpdateInput) =>
      apiClient
        .patch<{ data: Equipment }>(`/equipment/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
      toast.success('Equipment updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteEquipment() {
  return useMutation({
    mutationFn: (equipmentId: string) =>
      apiClient.delete<void>(`/equipment/${equipmentId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
      toast.success('Equipment deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
