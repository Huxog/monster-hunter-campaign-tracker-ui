import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { useAuthStore } from '../../features/auth/store';
import type { User } from '../../features/auth/types';

export const Route = createFileRoute('/auth/callback')({
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  beforeLoad: async ({ search }) => {
    const { token } = search;

    if (!token) {
      throw redirect({ to: '/login' });
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch user');

      const { data: user }: { data: User } = await res.json();
      useAuthStore.getState().setAuth(token, user);
    } catch {
      throw redirect({ to: '/login' });
    }

    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});
