import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { LoginForm } from '../features/auth/components/LoginForm';
import { GoogleAuthButton } from '../features/auth/components/GoogleAuthButton';
import { APP_NAME, APP_SERIES } from '../shared/lib/brand';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/campaigns' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left: Hero panel ──────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[58%]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            background: 'linear-gradient(135deg, #0a0905 0%, #111008 60%, #1e1a10 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="relative z-10 mt-auto p-12">
          <p className="text-5xl font-black uppercase leading-none tracking-tight text-cream drop-shadow-lg">
            {APP_SERIES}
          </p>
          <p className="mt-1 text-2xl font-light tracking-widest text-cream/70">
            {APP_NAME}
          </p>
        </div>
      </div>

      {/* ── Right: Form panel ────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {APP_SERIES}
            </p>
            <h1 className="text-2xl font-bold text-cream">{APP_NAME}</h1>
          </div>

          <h2 className="mb-6 text-2xl font-bold text-cream">Log In</h2>

          <GoogleAuthButton />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-primary/10" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-primary/10" />
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-light">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
