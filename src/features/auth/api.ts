import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../shared/lib/apiClient';
import { queryClient } from '../../shared/lib/queryClient';
import { useAuthStore } from './store';
import type { AuthResponse, User } from './types';
import type { LoginInput, RegisterInput } from './schemas';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const authKeys = {
  me: ['auth', 'me'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => apiClient.get<{ data: User }>('/auth/me').then((r) => r.data),
    enabled: !!useAuthStore.getState().token,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiClient.post<AuthResponse>('/auth/login', input),
    onSuccess: ({ data, token }) => {
      setAuth(token, data);
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiClient.post<AuthResponse>('/auth/register', {
        ...input,
        password_confirmation: input.password,
      }),
    onSuccess: ({ data, token }) => {
      setAuth(token, data);
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => apiClient.post<void>('/auth/logout', {}),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
