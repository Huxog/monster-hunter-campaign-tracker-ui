import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    throw redirect({ to: token ? '/dashboard' : '/login' });
  },
});
