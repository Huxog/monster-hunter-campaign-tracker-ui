import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { Material } from './types';
import type { MaterialCreateInput, MaterialUpdateInput } from './schemas';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const materialKeys = {
  all: ['materials'] as const,
  list: (params?: { page?: number }) =>
    [...materialKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...materialKeys.all, 'detail', id] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function materialsQueryOptions(params?: { page?: number }) {
  const qs = params?.page && params.page > 1 ? `?page=${params.page}` : '';
  return queryOptions({
    queryKey: materialKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Material>>(`/materials${qs}`),
    staleTime: 60 * 60 * 1000,
  });
}

export function materialQueryOptions(id: string) {
  return queryOptions({
    queryKey: materialKeys.detail(id),
    queryFn: () =>
      apiClient
        .get<{ data: Material }>(`/materials/${id}`)
        .then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMaterials(params?: { page?: number }) {
  return useQuery(materialsQueryOptions(params));
}

export function materialsAllQueryOptions() {
  return queryOptions({
    queryKey: materialKeys.list({ page: 0 }),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Material>>('/materials?per_page=0'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMaterialsAll() {
  return useQuery(materialsAllQueryOptions());
}

export function useMaterial(id: string) {
  return useQuery(materialQueryOptions(id));
}

export function useCreateMaterial() {
  return useMutation({
    mutationFn: (input: MaterialCreateInput) =>
      apiClient
        .post<{ data: Material }>('/materials', input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success('Material created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateMaterial(id: string) {
  return useMutation({
    mutationFn: (input: MaterialUpdateInput) =>
      apiClient
        .patch<{ data: Material }>(`/materials/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success('Material updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteMaterial() {
  return useMutation({
    mutationFn: (materialId: string) =>
      apiClient.delete<void>(`/materials/${materialId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
      toast.success('Material deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
