import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMaps, useCreateMap } from '../../../features/maps/api';
import { mapCreateSchema, type MapCreateInput } from '../../../features/maps/schemas';
import { useAuthStore } from '../../../features/auth/store';
import { Button } from '../../../shared/components/Button';
import { Field, Input } from '../../../shared/components/Field';
import { Pagination } from '../../../shared/components/Pagination';
import { ApiError } from '../../../shared/lib/apiClient';

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/maps/')({
  validateSearch: searchSchema,
  component: MapsPage,
});

function MapsPage() {
  const { page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isPending, isError } = useMaps({ page });

  function setPage(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }),
      replace: true,
    });
  }
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Maps</h1>
          <p className="mt-1 text-sm text-muted">Hunting grounds where campaigns take place.</p>
        </div>
        {isAdmin && !showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            + New map
          </Button>
        )}
      </div>

      {isAdmin && showCreateForm && (
        <div className="mb-6">
          <CreateMapForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {isPending && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load maps. Please try again.
        </div>
      )}

      {data && data.data.length === 0 && !showCreateForm && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No maps available.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((map) => (
            <Link
              key={map.id}
              to="/maps/$mapId"
              params={{ mapId: map.id }}
              className="group flex flex-col gap-2 rounded-lg border border-primary/15 bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-surface-alt"
            >
              <h3 className="font-semibold text-cream group-hover:text-primary transition-colors">
                {map.name}
              </h3>
              <p className="text-xs text-primary">View detail →</p>
            </Link>
            ))}
          </div>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Create map form ──────────────────────────────────────────────────────────

interface CreateMapFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateMapForm({ onSuccess, onCancel }: CreateMapFormProps) {
  const createMap = useCreateMap();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MapCreateInput>({
    resolver: zodResolver(mapCreateSchema),
  });

  const serverError =
    createMap.error instanceof ApiError ? createMap.error.message : null;

  const onSubmit = (data: MapCreateInput) => {
    createMap.mutate(data, { onSuccess });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">New map</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field label="Name" error={errors.name?.message} theme="light">
          {(id, hasError, theme) => (
            <Input
              {...register('name')}
              id={id}
              placeholder="e.g. Ancient Forest"
              hasError={hasError}
              theme={theme}
            />
          )}
        </Field>

        {serverError && (
          <p role="alert" className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="sm" loading={createMap.isPending}>
            Create map
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-6 w-6 animate-spin text-primary"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
