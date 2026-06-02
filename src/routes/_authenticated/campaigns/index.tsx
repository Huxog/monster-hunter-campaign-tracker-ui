import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCampaigns, useCreateCampaign } from '../../../features/campaigns/api';
import { campaignCreateSchema, type CampaignCreateInput } from '../../../features/campaigns/schemas';
import { useMaps } from '../../../features/maps/api';
import { useAuthStore } from '../../../features/auth/store';
import { CampaignCard } from '../../../features/campaigns/components/CampaignCard';
import { Button } from '../../../shared/components/Button';
import { Field, Input, Select } from '../../../shared/components/Field';
import { Pagination } from '../../../shared/components/Pagination';
import { ApiError } from '../../../shared/lib/apiClient';
import type { GameMap } from '../../../features/maps/types';

const searchSchema = z.object({
  mapId: z.string().uuid().optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/campaigns/')({
  validateSearch: searchSchema,
  component: CampaignsPage,
});

function CampaignsPage() {
  const { mapId, page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isPending, isError } = useCampaigns({ mapId, page });
  const { data: mapsData } = useMaps();

  const maps = mapsData?.data ?? [];

  function setMapFilter(id: string | undefined) {
    void navigate({ search: id ? { mapId: id } : {}, replace: true });
  }

  function setPage(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }),
      replace: true,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Campaigns</h1>
          <p className="mt-1 text-sm text-muted">All active hunting campaigns.</p>
        </div>
        {!showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            + New campaign
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-5">
          <CreateCampaignForm
            maps={maps}
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Map filter chips */}
      {maps.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <FilterChip
            label="All maps"
            active={!mapId}
            onClick={() => setMapFilter(undefined)}
          />
          {maps.map((map) => (
            <FilterChip
              key={map.id}
              label={map.name}
              active={mapId === map.id}
              onClick={() => setMapFilter(map.id)}
            />
          ))}
        </div>
      )}

      {isPending && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load campaigns. Please try again.
        </div>
      )}

      {data && data.data.length === 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">
            {mapId ? 'No campaigns in this map.' : 'No campaigns yet.'}
          </p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.data.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Create campaign form ─────────────────────────────────────────────────────

interface CreateCampaignFormProps {
  maps: GameMap[];
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateCampaignForm({ maps, onSuccess, onCancel }: CreateCampaignFormProps) {
  const createCampaign = useCreateCampaign();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignCreateInput>({
    resolver: zodResolver(campaignCreateSchema),
    defaultValues: { mapId: null },
  });

  const serverError =
    createCampaign.error instanceof ApiError ? createCampaign.error.message : null;

  const onSubmit = (data: CampaignCreateInput) => {
    createCampaign.mutate(data, {
      onSuccess: (campaign) => {
        onSuccess();
        void navigate({ to: '/campaigns/$campaignId', params: { campaignId: campaign.id } });
      },
    });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">New campaign</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Campaign name" error={errors.name?.message} theme="light">
            {(id, hasError, theme) => (
              <Input
                {...register('name')}
                id={id}
                placeholder="e.g. Rise of the Rathalos"
                hasError={hasError}
                theme={theme}
              />
            )}
          </Field>

          <Field label="Team name" error={errors.teamName?.message} theme="light">
            {(id, hasError, theme) => (
              <Input
                {...register('teamName')}
                id={id}
                placeholder="e.g. The Brave Hunters"
                hasError={hasError}
                theme={theme}
              />
            )}
          </Field>
        </div>

        {maps.length > 0 && (
          <Field label="Map (optional)" theme="light">
            {(id, hasError, theme) => (
              <Select {...register('mapId')} id={id} hasError={hasError} theme={theme}>
                <option value="">— No map —</option>
                {maps.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {serverError && (
          <p role="alert" className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="sm" loading={createCampaign.isPending}>
            Create campaign
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-primary text-cream'
          : 'bg-surface-alt border border-primary/20 text-muted hover:border-primary/40 hover:text-cream',
      ].join(' ')}
    >
      {label}
    </button>
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
