import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { LoginForm } from '../features/auth/components/LoginForm';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Decorative background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 60%, #c8952a18 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Gold top bar */}
        <div className="h-0.5 w-full rounded-t-lg bg-gradient-to-r from-transparent via-gold to-transparent" />

        <div className="rounded-b-lg border border-t-0 border-gold/20 bg-surface px-8 py-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">
              Monster Hunter
            </p>
            <h1 className="text-2xl font-bold text-cream">Campaign Tracker</h1>
            <p className="mt-3 text-sm text-muted">Sign in to your account</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
