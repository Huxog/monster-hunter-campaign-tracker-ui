import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuest, useUpdateQuest, useDeleteQuest } from '../../../../../features/quests/api';
import { questUpdateSchema, type QuestUpdateInput } from '../../../../../features/quests/schemas';
import { useCampaign, useCampaigns, useCampaignHunters } from '../../../../../features/campaigns/api';
import { useMonstersAll, useMonster } from '../../../../../features/monsters/api';
import { ELEMENTAL_TYPES, AILMENT_TYPES, type WeaknessScale } from '../../../../../features/monsters/types';
import { useAuthStore } from '../../../../../features/auth/store';
import { Button } from '../../../../../shared/components/Button';
import { ConfirmDialog } from '../../../../../shared/components/ConfirmDialog';
import { Field, Input, Select } from '../../../../../shared/components/Field';
import { ElementIcon } from '../../../../../shared/components/ElementIcon';
import { ApiError } from '../../../../../shared/lib/apiClient';
import { OutcomeBadge } from '../index';

export const Route = createFileRoute(
  '/_authenticated/campaigns/$campaignId/quests/$questId',
)({
  component: QuestDetailPage,
});

function QuestDetailPage() {
  const { campaignId, questId } = Route.useParams();
  const { data: quest, isPending, isError } = useQuest(questId);
  const { data: campaign } = useCampaign(campaignId);
  const { data: monster } = useMonster(quest?.monsterId ?? '');
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteQuest = useDeleteQuest();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !quest) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load quest. Please try again.
        </div>
      </div>
    );
  }

  const completedDate = quest.completedAt
    ? new Date(quest.completedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  function handleDelete() {
    deleteQuest.mutate(questId, {
      onSuccess: () => void navigate({ to: '/campaigns/$campaignId', params: { campaignId } }),
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link to="/campaigns" className="hover:text-cream transition-colors">
          Campaigns
        </Link>
        <span>/</span>
        <Link
          to="/campaigns/$campaignId"
          params={{ campaignId }}
          className="hover:text-cream transition-colors"
        >
          {campaign?.name ?? 'Campaign'}
        </Link>
        <span>/</span>
        <span className="hover:text-cream">Quests</span>
        <span>/</span>
        <span className="text-cream">
          {quest.monster?.name ?? '—'}
          {quest.monster?.stars ? (
            <span className="ml-1 text-ember">{'★'.repeat(quest.monster.stars)}</span>
          ) : null}
        </span>
      </nav>

      {/* Monster card */}
      <div className="mb-5 overflow-hidden rounded-lg border-2 border-primary/25 bg-surface shadow-sm ring-1 ring-inset ring-primary/10">
        <div className="flex gap-5 p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-surface-alt">
            {quest.monster?.imagePath ? (
              <img
                src={quest.monster.imagePath}
                alt={quest.monster.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg className="h-8 w-8 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-cream">
              {quest.monster?.name ?? '—'}
            </h1>
            {quest.monster?.stars && (
              <div className="mt-1 flex items-center gap-0.5">
                {Array.from({ length: quest.monster.stars }, (_, i) => (
                  <span key={i} className="text-sm text-ember">★</span>
                ))}
                {Array.from({ length: 7 - quest.monster.stars }, (_, i) => (
                  <span key={i} className="text-sm text-muted/30">★</span>
                ))}
              </div>
            )}
            {monster?.description && (
              <p className="mt-1 text-sm text-muted line-clamp-2">{monster.description}</p>
            )}
          </div>
        </div>

        {monster && (
          <div className="border-t border-primary/20">
            <div className="grid grid-cols-1 divide-y divide-primary/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-5">
                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Elemental
                </h2>
                <div className="rounded border border-primary/15 bg-surface-alt/60 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {ELEMENTAL_TYPES.map((el) => (
                      <WeaknessCell
                        key={el}
                        label={el}
                        value={(monster.elementalWeaknesses[el] ?? 0) as WeaknessScale}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Ailments
                </h2>
                <div className="rounded border border-primary/15 bg-surface-alt/60 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {AILMENT_TYPES.map((ail) => (
                      <WeaknessCell
                        key={ail}
                        label={ail}
                        value={(monster.ailmentWeaknesses[ail] ?? 0) as WeaknessScale}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quest status card */}
      <div className="mb-5 overflow-hidden rounded-lg border-2 border-primary/25 bg-surface p-6 shadow-sm ring-1 ring-inset ring-primary/10">
        {mode === 'edit' ? (
          <EditQuestForm
            questId={questId}
            campaignId={campaignId}
            quest={quest}
            onSuccess={() => setMode('view')}
            onCancel={() => setMode('view')}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <OutcomeBadge outcome={quest.outcome} />
                {completedDate && (
                  <span className="text-sm text-muted">Completed {completedDate}</span>
                )}
                {!quest.outcome && !quest.completedAt && (
                  <span className="text-sm text-muted">Hunt in progress</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setMode('edit')}>
                  Edit
                </Button>
                {isAdmin && (
                  <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <ConfirmDialog
              open={confirmDelete}
              title="Delete quest"
              description="Delete this quest record? This cannot be undone."
              onConfirm={handleDelete}
              onCancel={() => setConfirmDelete(false)}
              isPending={deleteQuest.isPending}
            />
          </>
        )}
      </div>

      {/* Hunter participants */}
      <div className="overflow-hidden rounded-lg border-2 border-primary/25 bg-surface p-6 shadow-sm ring-1 ring-inset ring-primary/10">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted">
          Participating Hunters
        </h2>
        {quest.hunters && quest.hunters.length > 0 ? (
          <div className="flex flex-col gap-2">
            {quest.hunters.map((hunter) => (
              <Link
                key={hunter.id}
                to="/hunters/$hunterId"
                params={{ hunterId: hunter.id }}
                className="group flex items-center gap-3 rounded-md border border-primary/15 bg-surface-alt/60 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-surface-alt"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-cream transition-colors group-hover:text-primary">
                    {hunter.hunterName}
                  </span>
                  <span className="ml-2 text-xs text-muted">{hunter.playerName}</span>
                </div>
                {hunter.class && (
                  <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {hunter.class}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No hunters recorded for this quest.</p>
        )}
      </div>
    </div>
  );
}

// ─── Weakness cell ────────────────────────────────────────────────────────────

function WeaknessCell({ label, value }: { label: string; value: WeaknessScale }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded border border-primary/10 bg-surface/70 py-2">
      <ElementIcon element={label} className="h-6 w-6" />
      <div className="flex gap-0.5">
        {([1, 2, 3] as const).map((level) => (
          <span
            key={level}
            className={level <= value ? 'text-base text-ember' : 'text-base text-muted/30'}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Edit quest form ──────────────────────────────────────────────────────────

interface EditQuestFormProps {
  questId: string;
  campaignId: string;
  quest: ReturnType<typeof useQuest>['data'];
  onSuccess: () => void;
  onCancel: () => void;
}

function EditQuestForm({ questId, campaignId, quest, onSuccess, onCancel }: EditQuestFormProps) {
  const updateQuest = useUpdateQuest(questId);
  const { data: campaignsData } = useCampaigns();
  const campaigns = campaignsData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuestUpdateInput>({
    resolver: zodResolver(questUpdateSchema),
    defaultValues: {
      campaignId: quest?.campaignId,
      monsterId: quest?.monsterId,
      hunterIds: quest?.hunters?.map((h) => h.id) ?? [],
      outcome: quest?.outcome ?? undefined,
      completedAt: quest?.completedAt
        ? quest.completedAt.split('T')[0]
        : undefined,
    },
  });

  const watchedCampaignId = watch('campaignId') ?? campaignId;
  const { data: monstersData } = useMonstersAll();
  const monsters = monstersData?.data ?? [];
  const { data: huntersData } = useCampaignHunters(watchedCampaignId, Boolean(watchedCampaignId));
  const hunters = huntersData?.data ?? [];

  const serverError =
    updateQuest.error instanceof ApiError ? updateQuest.error.message : null;

  const onSubmit = (data: QuestUpdateInput) => {
    const payload: QuestUpdateInput = {
      ...data,
      outcome: data.outcome ?? null,
      completedAt: data.completedAt || null,
    };
    updateQuest.mutate(payload, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <h3 className="font-semibold text-cream">Edit quest</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Campaign" error={errors.campaignId?.message} theme="light">
          {(id, hasError, theme) => (
            <Select {...register('campaignId')} id={id} hasError={hasError} theme={theme}>
              <option value="">— Select campaign —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Monster" error={errors.monsterId?.message} theme="light">
          {(id, hasError, theme) => (
            <Select {...register('monsterId')} id={id} hasError={hasError} theme={theme}>
              <option value="">— Select monster —</option>
              {monsters.map((m) => (
                <option key={m.id} value={m.id}>
                  {'★'.repeat(m.stars)} {m.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-cream/80">Participating hunters</span>
        {hunters.length === 0 ? (
          <p className="text-sm text-muted">No hunters in the selected campaign.</p>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-md border border-primary/20 bg-surface-alt p-3">
            {hunters.map((hunter) => (
              <label key={hunter.id} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  value={hunter.id}
                  {...register('hunterIds')}
                  className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary/40"
                />
                <span className="text-sm text-cream">{hunter.hunterName}</span>
                <span className="text-xs text-muted">{hunter.playerName}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Outcome" theme="light">
          {(id, hasError, theme) => (
            <Select {...register('outcome')} id={id} hasError={hasError} theme={theme}>
              <option value="">— In progress —</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="abandoned">Abandoned</option>
            </Select>
          )}
        </Field>

        <Field label="Completed at" theme="light">
          {(id, hasError, theme) => (
            <Input
              {...register('completedAt')}
              id={id}
              type="date"
              hasError={hasError}
              theme={theme}
            />
          )}
        </Field>
      </div>

      {serverError && (
        <p role="alert" className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={updateQuest.isPending}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
