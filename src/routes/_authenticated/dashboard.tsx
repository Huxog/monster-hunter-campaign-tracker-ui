import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gold">Dashboard</h1>
      <p className="mt-2 text-muted">Campaign overview coming soon.</p>
    </div>
  );
}
