import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMap, useUpdateMap, useDeleteMap } from '../../../features/maps/api';
import { mapUpdateSchema, type MapUpdateInput } from '../../../features/maps/schemas';
import { useAuthStore } from '../../../features/auth/store';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Field, Input } from '../../../shared/components/Field';
import { ApiError } from '../../../shared/lib/apiClient';

export const Route = createFileRoute('/_authenticated/maps/$mapId')({
  component: MapDetailPage,
});

function MapDetailPage() {
  const { mapId } = Route.useParams();
  const { data: map, isPending, isError } = useMap(mapId);
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  const deleteMap = useDeleteMap();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !map) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load map. Please try again.
        </div>
      </div>
    );
  }

  function handleDelete() {
    deleteMap.mutate(mapId, {
      onSuccess: () => void navigate({ to: '/maps' }),
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link to="/maps" className="hover:text-cream transition-colors">
          Maps
        </Link>
        <span>/</span>
        <span className="text-cream">{map.name}</span>
      </nav>

      {/* Header */}
      <div className="rounded-lg border border-primary/15 bg-surface p-6 mb-6">
        {mode === 'edit' ? (
          <EditMapForm
            mapId={mapId}
            defaultValues={{ name: map.name }}
            onSuccess={() => setMode('view')}
            onCancel={() => setMode('view')}
          />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-cream">{map.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {map.campaigns?.length ?? 0} campaign{(map.campaigns?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
            {isAdmin && mode === 'view' && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setMode('edit')}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={confirmDelete}
          title="Delete map"
          description={`Delete "${map.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          isPending={deleteMap.isPending}
        />
      </div>

      {/* Campaigns on this map */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Campaigns
      </h2>

      {(!map.campaigns || map.campaigns.length === 0) && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">No campaigns on this map yet.</p>
          <Link
            to="/campaigns"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Browse all campaigns →
          </Link>
        </div>
      )}

      {map.campaigns && map.campaigns.length > 0 && (
        <div className="flex flex-col gap-2">
          {map.campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to="/campaigns/$campaignId"
              params={{ campaignId: campaign.id }}
              className="group flex items-center justify-between rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-surface-alt"
            >
              <div>
                <span className="font-medium text-cream group-hover:text-primary transition-colors">
                  {campaign.name}
                </span>
                <span className="ml-2 text-sm text-muted">— {campaign.teamName}</span>
              </div>
              <span className="text-xs text-primary">View →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Edit map form ────────────────────────────────────────────────────────────

interface EditMapFormProps {
  mapId: string;
  defaultValues: MapUpdateInput;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditMapForm({ mapId, defaultValues, onSuccess, onCancel }: EditMapFormProps) {
  const updateMap = useUpdateMap(mapId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MapUpdateInput>({
    resolver: zodResolver(mapUpdateSchema),
    defaultValues,
  });

  const serverError =
    updateMap.error instanceof ApiError ? updateMap.error.message : null;

  const onSubmit = (data: MapUpdateInput) => {
    updateMap.mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Name" error={errors.name?.message} theme="light">
        {(id, hasError, theme) => (
          <Input
            {...register('name')}
            id={id}
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

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={updateMap.isPending}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
