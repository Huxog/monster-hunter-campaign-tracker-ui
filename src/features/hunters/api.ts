import { queryOptions, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import type { Hunter } from './types';
import type {
  HunterCreateInput,
  HunterUpdateInput,
  AddLootInput,
  UpdateLootInput,
  CraftInput,
} from './schemas';
import type { Weapon } from '../weapons/types';
import type { Equipment } from '../equipment/types';
import type { PaginatedResponse } from '../../shared/types/api';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const hunterKeys = {
  all: ['hunters'] as const,
  list: (params?: { campaignId?: string; page?: number }) =>
    [...hunterKeys.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...hunterKeys.all, 'detail', id] as const,
  craftables: (id: string) => [...hunterKeys.all, 'craftables', id] as const,
};

// ─── Query options ────────────────────────────────────────────────────────────

export function huntersQueryOptions(params?: { campaignId?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params?.campaignId) search.set('campaignId', params.campaignId);
  if (params?.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();

  return queryOptions({
    queryKey: hunterKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Hunter>>(`/hunters${qs ? `?${qs}` : ''}`),
  });
}

export function hunterQueryOptions(id: string) {
  return queryOptions({
    queryKey: hunterKeys.detail(id),
    queryFn: () =>
      apiClient.get<{ data: Hunter }>(`/hunters/${id}`).then((r) => r.data),
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useHunters(params?: { campaignId?: string; page?: number }) {
  return useQuery(huntersQueryOptions(params));
}

export function useHunter(id: string, enabled = true) {
  return useQuery({ ...hunterQueryOptions(id), enabled });
}

export function useCreateHunter() {
  return useMutation({
    mutationFn: (input: HunterCreateInput) =>
      apiClient
        .post<{ data: Hunter }>('/hunters', input)
        .then((r) => r.data),
    onSuccess: (hunter) => {
      void queryClient.invalidateQueries({ queryKey: hunterKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ['campaigns', 'detail', hunter.campaignId],
      });
      toast.success('Hunter created');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateHunter(id: string) {
  return useMutation({
    mutationFn: (input: HunterUpdateInput) =>
      apiClient
        .patch<{ data: Hunter }>(`/hunters/${id}`, input)
        .then((r) => r.data),
    onSuccess: (hunter) => {
      void queryClient.invalidateQueries({ queryKey: hunterKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ['campaigns', 'detail', hunter.campaignId],
      });
      toast.success('Hunter updated');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useDeleteHunter() {
  return useMutation({
    mutationFn: (hunterId: string) =>
      apiClient.delete<void>(`/hunters/${hunterId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hunterKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Hunter deleted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

// ─── Equip ────────────────────────────────────────────────────────────────────

export type EquipSlot = 'weapon' | 'helmet' | 'vest' | 'trouser';

const slotLabel: Record<EquipSlot, string> = {
  weapon: 'Weapon',
  helmet: 'Helmet',
  vest: 'Vest',
  trouser: 'Trousers',
};

export function useEquip(hunterId: string, slot: EquipSlot) {
  return useMutation({
    mutationFn: (equippableId: string) =>
      apiClient
        .post<{ data: Hunter }>(`/hunters/${hunterId}/equip/${slot}`, { equippableId })
        .then((r) => r.data),
    onSuccess: (hunter) => {
      queryClient.setQueryData(hunterKeys.detail(hunterId), hunter);
      toast.success(`${slotLabel[slot]} equipped`);
    },
    onError: () => toast.error('Something went wrong'),
  });
}

// ─── Craftables & craft ───────────────────────────────────────────────────────

export function useCraftables(hunterId: string) {
  return useQuery({
    queryKey: hunterKeys.craftables(hunterId),
    queryFn: () =>
      apiClient
        .get<{ data: { weapons: Weapon[]; equipment: Equipment[] } }>(
          `/hunters/${hunterId}/craftables`,
        )
        .then((r) => r.data),
  });
}

export function useCraft(hunterId: string) {
  return useMutation({
    mutationFn: (input: CraftInput) =>
      apiClient.post<{ data: Weapon | Equipment }>(`/hunters/${hunterId}/craft`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hunterKeys.detail(hunterId) });
      void queryClient.invalidateQueries({ queryKey: hunterKeys.craftables(hunterId) });
      toast.success('Item crafted');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

// ─── Loot mutations ───────────────────────────────────────────────────────────

export function useAddLoot(hunterId: string) {
  return useMutation({
    mutationFn: (input: AddLootInput) =>
      apiClient
        .post<{ data: Hunter }>(`/hunters/${hunterId}/loot`, input)
        .then((r) => r.data),
    onSuccess: (hunter) => {
      queryClient.setQueryData(hunterKeys.detail(hunterId), hunter);
      void queryClient.invalidateQueries({ queryKey: hunterKeys.craftables(hunterId) });
      toast.success('Loot added');
    },
    onError: () => toast.error('Something went wrong'),
  });
}

export function useUpdateLoot(hunterId: string) {
  return useMutation({
    mutationFn: ({ materialId, quantity }: UpdateLootInput & { materialId: string }) =>
      apiClient
        .patch<{ data: Hunter }>(`/hunters/${hunterId}/loot/${materialId}`, { quantity })
        .then((r) => r.data),
    onMutate: async ({ materialId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: hunterKeys.detail(hunterId) });
      const snapshot = queryClient.getQueryData<Hunter>(hunterKeys.detail(hunterId));
      if (snapshot?.loot) {
        queryClient.setQueryData<Hunter>(hunterKeys.detail(hunterId), {
          ...snapshot,
          loot: snapshot.loot.map((entry) =>
            entry.id === materialId ? { ...entry, quantity } : entry,
          ),
        });
      }
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(hunterKeys.detail(hunterId), context.snapshot);
      }
      toast.error('Something went wrong');
    },
    onSuccess: (hunter) => {
      queryClient.setQueryData(hunterKeys.detail(hunterId), hunter);
      void queryClient.invalidateQueries({ queryKey: hunterKeys.craftables(hunterId) });
    },
  });
}

export function useRemoveLoot(hunterId: string) {
  return useMutation({
    mutationFn: (materialId: string) =>
      apiClient
        .delete<{ data: Hunter }>(`/hunters/${hunterId}/loot/${materialId}`)
        .then((r) => r.data),
    onSuccess: (hunter) => {
      queryClient.setQueryData(hunterKeys.detail(hunterId), hunter);
      void queryClient.invalidateQueries({ queryKey: hunterKeys.craftables(hunterId) });
      toast.success('Loot removed');
    },
    onError: () => toast.error('Something went wrong'),
  });
}
