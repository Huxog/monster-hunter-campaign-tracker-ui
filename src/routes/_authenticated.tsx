import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background text-cream">
      <Outlet />
    </div>
  );
}
