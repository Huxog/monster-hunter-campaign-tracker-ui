import { createRootRouteWithContext, Outlet, Link, useRouter } from '@tanstack/react-router';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools />
          <TanStackRouterDevtools />
        </>
      )}
    </>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-7xl font-black text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-cream">Trail Lost</h1>
      <p className="mt-2 text-sm text-muted">
        The path you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-primary-light"
      >
        Back to Base Camp
      </Link>
    </div>
  );
}

function ErrorPage({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-7xl font-black text-ember">!</p>
      <h1 className="mt-4 text-2xl font-bold text-cream">Something Went Wrong</h1>
      <p className="mt-2 text-sm text-muted">An unexpected error occurred. Try again or return to base camp.</p>
      {import.meta.env.DEV && error.message && (
        <pre className="mt-4 max-w-lg overflow-auto rounded-md border border-ember/20 bg-surface p-4 text-left text-xs text-ember">
          {error.message}
        </pre>
      )}
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.invalidate()}
          className="rounded-md border border-primary/20 bg-surface-alt px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-surface"
        >
          Try Again
        </button>
        <Link
          to="/dashboard"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-primary-light"
        >
          Back to Base Camp
        </Link>
      </div>
    </div>
  );
}
