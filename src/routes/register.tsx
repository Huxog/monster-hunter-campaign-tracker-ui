import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { APP_NAME, APP_SERIES } from '../shared/lib/brand';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left: Hero panel (same as login) ────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[58%]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            background: 'linear-gradient(135deg, #0d1b2e 0%, #111008 60%, #1a1005 100%)',
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

      {/* ── Right: Form panel ────────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand header */}
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {APP_SERIES}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          </div>

          <h2 className="mb-6 text-2xl font-bold text-gray-900">Create Account</h2>

          <RegisterForm theme="light" />

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
