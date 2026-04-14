import { createFileRoute, redirect, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { useLogout } from '../features/auth/api';
import { Button } from '../shared/components/Button';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => void navigate({ to: '/login' }),
    });
  };

  return (
    <div className="min-h-screen bg-background text-cream">
      <header className="flex items-center justify-end border-b border-gold/10 px-6 py-3">
        <Button variant="ghost" size="sm" onClick={handleLogout} loading={logout.isPending}>
          Log out
        </Button>
      </header>
      <Outlet />
    </div>
  );
}
