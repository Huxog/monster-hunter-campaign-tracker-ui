import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCampaign,
  useCampaignHunters,
  useCampaignQuests,
  useCampaignLoot,
  useUpdateCampaign,
  useDeleteCampaign,
} from '../../../../features/campaigns/api';
import { campaignUpdateSchema, type CampaignUpdateInput } from '../../../../features/campaigns/schemas';
import { useCreateHunter } from '../../../../features/hunters/api';
import { hunterCreateSchema, type HunterCreateInput } from '../../../../features/hunters/schemas';
import { useMaps } from '../../../../features/maps/api';
import { useMonstersAll } from '../../../../features/monsters/api';
import { useCreateQuest } from '../../../../features/quests/api';
import { questCreateSchema, type QuestCreateInput } from '../../../../features/quests/schemas';
import { useAuthStore } from '../../../../features/auth/store';
import { useCreateInvitation } from '../../../../features/invitations/api';
import {
  createInvitationSchema,
  type CreateInvitationInput,
} from '../../../../features/invitations/schemas';
import { ElementIcon } from '../../../../shared/components/ElementIcon';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs } from '../../../../shared/components/Tabs';
import { Button } from '../../../../shared/components/Button';
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog';
import { Field, Input, Select } from '../../../../shared/components/Field';
import { ApiError } from '../../../../shared/lib/apiClient';
import type { Hunter, HunterLootEntry } from '../../../../features/hunters/types';
import type { Quest } from '../../../../features/quests/types';

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/')({
  component: CampaignDetailPage,
});

const TABS = [
  { id: 'hunters', label: 'Hunters' },
  { id: 'quests', label: 'Quests' },
  { id: 'loot', label: 'Loot' },
];

function CampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const { data: campaign, isPending, isError } = useCampaign(campaignId);
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [activeTab, setActiveTab] = useState('hunters');
  // Track which tabs have been opened so their queries stay enabled after first load
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['hunters']));
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const deleteCampaign = useDeleteCampaign();
  const navigate = useNavigate();

  const { data: huntersData, isPending: huntersPending } = useCampaignHunters(
    campaignId,
    loadedTabs.has('hunters'),
  );
  const { data: questsData, isPending: questsPending } = useCampaignQuests(
    campaignId,
    loadedTabs.has('quests'),
  );
  const { data: lootData, isPending: lootPending } = useCampaignLoot(
    campaignId,
    loadedTabs.has('loot'),
  );

  function handleTabChange(id: string) {
    setActiveTab(id);
    setLoadedTabs((prev) => new Set([...prev, id]));
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load campaign. Please try again.
        </div>
      </div>
    );
  }

  const startDate = new Date(campaign.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hunterCount = huntersData?.meta.total ?? campaign.hunters?.length ?? 0;

  function handleDelete() {
    deleteCampaign.mutate(campaignId, {
      onSuccess: () => void navigate({ to: '/campaigns' }),
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link to="/campaigns" className="hover:text-cream transition-colors">
          Campaigns
        </Link>
        <span>/</span>
        <span>{campaign.name}</span>
        <span>/</span>
        <span className="text-cream capitalize">{activeTab}</span>
      </nav>

      {/* Header */}
      <div className="rounded-lg border border-primary/15 bg-surface p-6 mb-6">
        {mode === 'edit' ? (
          <EditCampaignForm
            campaignId={campaignId}
            defaultValues={{
              name: campaign.name,
              teamName: campaign.teamName,
              mapId: campaign.mapId,
            }}
            onSuccess={() => setMode('view')}
            onCancel={() => setMode('view')}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-cream">{campaign.name}</h1>
                <p className="mt-1 text-sm text-muted">{campaign.teamName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowInviteModal(true)}>
                  Invite
                </Button>
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

            <div className="mt-5 flex flex-wrap gap-6 text-sm">
              <Stat label="Map" value={campaign.map?.name ?? '—'} />
              <Stat label="Hunters" value={String(hunterCount)} />
              <Stat label="Started" value={startDate} />
            </div>

            <ConfirmDialog
              open={confirmDelete}
              title="Delete campaign"
              description={`Delete "${campaign.name}"? This will remove all associated data and cannot be undone.`}
              onConfirm={handleDelete}
              onCancel={() => setConfirmDelete(false)}
              isPending={deleteCampaign.isPending}
            />

            <InviteModal
              open={showInviteModal}
              campaignId={campaignId}
              onClose={() => setShowInviteModal(false)}
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === 'hunters' && (
          <HuntersTab
            campaignId={campaignId}
            hunters={huntersData?.data ?? []}
            isPending={huntersPending}
          />
        )}
        {activeTab === 'quests' && (
          <QuestsTab
            campaignId={campaignId}
            hunters={huntersData?.data ?? []}
            quests={questsData?.data ?? []}
            isPending={questsPending}
          />
        )}
        {activeTab === 'loot' && (
          <LootTab loot={lootData?.data ?? []} isPending={lootPending} />
        )}
      </Tabs>
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
      <span className="font-medium text-cream">{value}</span>
    </div>
  );
}

// ─── Edit campaign form ───────────────────────────────────────────────────────

interface EditCampaignFormProps {
  campaignId: string;
  defaultValues: CampaignUpdateInput;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditCampaignForm({ campaignId, defaultValues, onSuccess, onCancel }: EditCampaignFormProps) {
  const updateCampaign = useUpdateCampaign(campaignId);
  const { data: mapsData } = useMaps();
  const maps = mapsData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignUpdateInput>({
    resolver: zodResolver(campaignUpdateSchema),
    defaultValues,
  });

  const serverError =
    updateCampaign.error instanceof ApiError ? updateCampaign.error.message : null;

  const onSubmit = (data: CampaignUpdateInput) => {
    updateCampaign.mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Campaign name" error={errors.name?.message} theme="light">
          {(id, hasError, theme) => (
            <Input {...register('name')} id={id} hasError={hasError} theme={theme} />
          )}
        </Field>
        <Field label="Team name" error={errors.teamName?.message} theme="light">
          {(id, hasError, theme) => (
            <Input {...register('teamName')} id={id} hasError={hasError} theme={theme} />
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

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={updateCampaign.isPending}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Hunters tab ──────────────────────────────────────────────────────────────

interface HuntersTabProps {
  campaignId: string;
  hunters: Hunter[];
  isPending: boolean;
}

function HuntersTab({ campaignId, hunters, isPending }: HuntersTabProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {isPending && (
        <>
          <HunterRowSkeleton />
          <HunterRowSkeleton />
          <HunterRowSkeleton />
        </>
      )}

      {!isPending && hunters.length === 0 && !showForm && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">No hunters in this campaign yet.</p>
        </div>
      )}

      {!isPending && hunters.map((hunter) => (
        <HunterRow key={hunter.id} hunter={hunter} />
      ))}

      {showForm ? (
        <CreateHunterForm
          campaignId={campaignId}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-transparent px-4 py-3 text-sm text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Create your hunter
        </button>
      )}
    </div>
  );
}

// ─── Hunter row ───────────────────────────────────────────────────────────────

function HunterRow({ hunter }: { hunter: Hunter }) {
  return (
    <Link
      to="/hunters/$hunterId"
      params={{ hunterId: hunter.id }}
      className="group flex flex-col gap-3 rounded-lg border border-primary/15 bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-alt sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-cream group-hover:text-primary transition-colors truncate">
            {hunter.hunterName}
          </span>
          {hunter.class && (
            <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {hunter.class}
            </span>
          )}
        </div>
        <span className="text-sm text-muted">{hunter.playerName}</span>
      </div>

      <div className="flex items-center gap-2">
        <GearSlot
          imagePath={hunter.weapon?.imagePath}
          filled={Boolean(hunter.weapon)}
          sublabel={
            hunter.weapon && hunter.weapon.element !== 'None'
              ? <span className="flex items-center gap-0.5"><ElementIcon element={hunter.weapon.element} className="h-3 w-3" />{hunter.weapon.element}</span>
              : null
          }
        />
        <GearSlot
          imagePath={hunter.helmet?.imagePath}
          filled={Boolean(hunter.helmet)}
          sublabel={hunter.helmet?.armor != null ? `${hunter.helmet.armor}` : null}
        />
        <GearSlot
          imagePath={hunter.vest?.imagePath}
          filled={Boolean(hunter.vest)}
          sublabel={hunter.vest?.armor != null ? `${hunter.vest.armor}` : null}
        />
        <GearSlot
          imagePath={hunter.trousers?.imagePath}
          filled={Boolean(hunter.trousers)}
          sublabel={hunter.trousers?.armor != null ? `${hunter.trousers.armor}` : null}
        />
      </div>
    </Link>
  );
}

interface GearSlotProps {
  imagePath?: string | null;
  filled: boolean;
  sublabel?: React.ReactNode;
}

function GearSlot({ imagePath, filled, sublabel }: GearSlotProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex h-9 w-9 items-center justify-center rounded border border-primary/15 bg-background overflow-hidden">
        {imagePath ? (
          <img src={imagePath} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg
            className={['h-4 w-4', filled ? 'text-primary/40' : 'text-primary/15'].join(' ')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {filled ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            )}
          </svg>
        )}
      </div>
      {sublabel != null ? (
        <span className="text-[9px] font-medium text-primary">{sublabel}</span>
      ) : (
        <span className="text-[9px] text-muted/40">—</span>
      )}
    </div>
  );
}

// ─── Hunter row skeleton ──────────────────────────────────────────────────────

function HunterRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/15 bg-surface p-4 animate-pulse sm:flex-row sm:items-center">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-primary/10" />
        <div className="h-3 w-20 rounded bg-primary/10" />
      </div>
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="h-9 w-9 rounded border border-primary/10 bg-primary/5" />
            <div className="h-2 w-6 rounded bg-primary/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Create hunter form ───────────────────────────────────────────────────────

interface CreateHunterFormProps {
  campaignId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateHunterForm({ campaignId, onSuccess, onCancel }: CreateHunterFormProps) {
  const createHunter = useCreateHunter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HunterCreateInput>({
    resolver: zodResolver(hunterCreateSchema),
    defaultValues: { campaignId },
  });

  const serverError =
    createHunter.error instanceof ApiError ? createHunter.error.message : null;

  const onSubmit = (data: HunterCreateInput) => {
    createHunter.mutate(data, { onSuccess });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">Create your hunter</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <input type="hidden" {...register('campaignId')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Player name" error={errors.playerName?.message} theme="light">
            {(id, hasError, theme) => (
              <Input
                {...register('playerName')}
                id={id}
                placeholder="Your name"
                hasError={hasError}
                theme={theme}
              />
            )}
          </Field>
          <Field label="Hunter name" error={errors.hunterName?.message} theme="light">
            {(id, hasError, theme) => (
              <Input
                {...register('hunterName')}
                id={id}
                placeholder="Your hunter's name"
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

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="sm" loading={createHunter.isPending}>
            Create hunter
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Quests tab ───────────────────────────────────────────────────────────────

interface QuestsTabProps {
  campaignId: string;
  hunters: Hunter[];
  quests: Quest[];
  isPending: boolean;
}

function QuestsTab({ campaignId, hunters, quests, isPending }: QuestsTabProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {isPending && (
        <>
          <QuestRowSkeleton />
          <QuestRowSkeleton />
          <QuestRowSkeleton />
        </>
      )}

      {!isPending && quests.length === 0 && !showForm && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">No quests recorded yet.</p>
        </div>
      )}

      {!isPending && quests.length > 0 && (
        <QuestStatsChart quests={quests} />
      )}

      {!isPending && [...quests].reverse().map((quest) => (
        <QuestRow key={quest.id} quest={quest} campaignId={campaignId} />
      ))}

      {showForm ? (
        <CreateQuestForm
          campaignId={campaignId}
          campaignHunters={hunters}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-transparent px-4 py-3 text-sm text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Log a quest
        </button>
      )}
    </div>
  );
}

// ─── Quest stats chart ────────────────────────────────────────────────────────

const OUTCOME_CONFIG = [
  { key: 'success',   label: 'Success',     color: '#4ade80' },
  { key: 'failure',   label: 'Failure',     color: '#c04040' },
  { key: 'abandoned', label: 'Abandoned',   color: '#8a7a5a' },
  { key: null,        label: 'In progress', color: '#c8952a' },
] as const;

function QuestStatsChart({ quests }: { quests: Quest[] }) {
  const counts = {
    success:   quests.filter((q) => q.outcome === 'success').length,
    failure:   quests.filter((q) => q.outcome === 'failure').length,
    abandoned: quests.filter((q) => q.outcome === 'abandoned').length,
    active:    quests.filter((q) => q.outcome === null).length,
  };

  const data = [
    { name: 'Success',     value: counts.success,   color: '#4ade80' },
    { name: 'Failure',     value: counts.failure,   color: '#c04040' },
    { name: 'Abandoned',   value: counts.abandoned, color: '#8a7a5a' },
    { name: 'In progress', value: counts.active,    color: '#c8952a' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  const total = quests.length;
  const successRate = total > 0 ? Math.round((counts.success / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-primary/15 bg-surface p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
        Quest Outcomes
      </h3>
      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2a2416',
                  border: '1px solid rgba(200,149,42,0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#f0e3c0',
                }}
                itemStyle={{ color: '#f0e3c0' }}
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats breakdown */}
        <div className="flex flex-1 flex-col gap-2">
          {OUTCOME_CONFIG.map(({ label, color, key }) => {
            const value = key === null ? counts.active : counts[key];
            if (value === 0) return null;
            const pct = Math.round((value / total) * 100);
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1 text-xs text-muted">{label}</span>
                <span className="text-xs font-semibold text-cream">{value}</span>
                <span className="w-8 text-right text-xs text-muted">{pct}%</span>
              </div>
            );
          })}
          <div className="mt-1 border-t border-primary/10 pt-2 flex items-center justify-between">
            <span className="text-xs text-muted">Success rate</span>
            <span className="text-sm font-bold text-primary">{successRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quest row ────────────────────────────────────────────────────────────────

function QuestRow({ quest, campaignId }: { quest: Quest; campaignId: string }) {
  const date = quest.completedAt
    ? new Date(quest.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      to="/campaigns/$campaignId/quests/$questId"
      params={{ campaignId, questId: quest.id }}
      className="group flex items-center gap-3 rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-surface-alt"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary/15 bg-surface overflow-hidden">
        {quest.monster?.imagePath ? (
          <img src={quest.monster.imagePath} alt={quest.monster.name} className="h-full w-full object-cover" />
        ) : (
          <svg className="h-4 w-4 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        )}
      </div>

      <span className="flex-1 min-w-0 text-sm font-medium text-cream group-hover:text-primary transition-colors truncate">
        {quest.monster?.name ?? '—'}
      </span>

      <div className="flex shrink-0 items-center gap-3">
        {date && <span className="text-xs text-muted hidden sm:block">{date}</span>}
        <OutcomeBadge outcome={quest.outcome} />
      </div>
    </Link>
  );
}

// ─── Quest row skeleton ───────────────────────────────────────────────────────

function QuestRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-surface px-4 py-3 animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded border border-primary/10 bg-primary/5" />
      <div className="h-4 flex-1 rounded bg-primary/10" />
      <div className="h-5 w-16 rounded bg-primary/10" />
    </div>
  );
}

// ─── Outcome badge ────────────────────────────────────────────────────────────

export function OutcomeBadge({ outcome }: { outcome: 'success' | 'failure' | 'abandoned' | null }) {
  if (!outcome) {
    return <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">In progress</span>;
  }
  const styles = {
    success: 'bg-green-900/40 text-green-300',
    failure: 'bg-ember/10 text-ember',
    abandoned: 'bg-surface-alt text-muted',
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles[outcome]}`}>
      {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
    </span>
  );
}

// ─── Create quest form ────────────────────────────────────────────────────────

interface CreateQuestFormProps {
  campaignId: string;
  campaignHunters: Hunter[];
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateQuestForm({ campaignId, campaignHunters, onSuccess, onCancel }: CreateQuestFormProps) {
  const createQuest = useCreateQuest();
  const { data: monstersData } = useMonstersAll();
  const monsters = monstersData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestCreateInput>({
    resolver: zodResolver(questCreateSchema),
    defaultValues: { campaignId, hunterIds: [] },
  });

  const serverError =
    createQuest.error instanceof ApiError ? createQuest.error.message : null;

  const onSubmit = (data: QuestCreateInput) => {
    const payload: QuestCreateInput = {
      ...data,
      outcome: data.outcome || null,
      completedAt: data.completedAt || null,
    };
    createQuest.mutate(payload, { onSuccess });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">Log a quest</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <input type="hidden" {...register('campaignId')} />

        <Field label="Monster" error={errors.monsterId?.message} theme="light">
          {(id, hasError, theme) => (
            <Select {...register('monsterId')} id={id} hasError={hasError} theme={theme}>
              <option value="">— Select a monster —</option>
              {monsters.map((m) => (
                <option key={m.id} value={m.id}>
                  {'★'.repeat(m.stars)} {m.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-cream/80">
            Participating hunters
          </span>
          {campaignHunters.length === 0 ? (
            <p className="text-sm text-muted">No hunters in this campaign yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5 rounded-md border border-primary/20 bg-surface-alt p-3">
              {campaignHunters.map((hunter) => (
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
          {errors.hunterIds && (
            <p className="text-xs text-red-600">{errors.hunterIds.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Outcome (optional)" theme="light">
            {(id, hasError, theme) => (
              <Select {...register('outcome')} id={id} hasError={hasError} theme={theme}>
                <option value="">— In progress —</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="abandoned">Abandoned</option>
              </Select>
            )}
          </Field>

          <Field label="Completed at (optional)" theme="light">
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

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="sm" loading={createQuest.isPending}>
            Log quest
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Loot tab ─────────────────────────────────────────────────────────────────

interface LootTabProps {
  loot: HunterLootEntry[];
  isPending: boolean;
}

function LootTab({ loot, isPending }: LootTabProps) {
  const [search, setSearch] = useState('');

  if (isPending) {
    return (
      <div className="rounded-lg border border-primary/15 bg-surface overflow-hidden animate-pulse">
        <div className="border-b border-primary/10 px-4 py-2 flex gap-8">
          <div className="h-3 w-24 rounded bg-primary/10" />
          <div className="h-3 w-12 rounded bg-primary/10" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-8 border-b border-primary/10 last:border-0 px-4 py-3">
            <div className="h-4 w-32 rounded bg-primary/10" />
            <div className="h-4 w-8 rounded bg-primary/10" />
          </div>
        ))}
      </div>
    );
  }

  if (loot.length === 0) {
    return (
      <div className="rounded-lg border border-primary/15 bg-surface px-6 py-10 text-center">
        <p className="text-sm text-muted">No loot collected yet in this campaign.</p>
      </div>
    );
  }

  const filtered = loot.filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Search materials…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-primary/20 bg-surface-alt px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <div className="rounded-lg border border-primary/15 bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10 text-left">
              <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Material
              </th>
              <th className="w-28 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm text-muted">
                  No materials match "{search}".
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-primary/10 last:border-0">
                  <td className="px-4 py-3 text-cream">{entry.name}</td>
                  <td className="px-4 py-3 font-medium text-cream">{entry.quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

interface InviteModalProps {
  open: boolean;
  campaignId: string;
  onClose: () => void;
}

function InviteModal({ open, campaignId, onClose }: InviteModalProps) {
  const createInvitation = useCreateInvitation(campaignId);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
  });

  function handleClose() {
    reset();
    setInviteLink(null);
    setCopied(false);
    createInvitation.reset();
    onClose();
  }

  function copyLink() {
    if (!inviteLink) return;
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const onSubmit = (data: CreateInvitationInput) => {
    createInvitation.mutate(data, {
      onSuccess: (res) => {
        const token = res.data.token;
        const link = `${window.location.origin}/invitations/${token}`;
        setInviteLink(link);
      },
    });
  };

  const serverError =
    createInvitation.error instanceof ApiError
      ? createInvitation.error.message
      : null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-lg border-2 border-primary/25 bg-surface p-6 shadow-xl ring-1 ring-inset ring-primary/10">
        <h2 className="mb-4 text-base font-semibold text-cream">Invite to campaign</h2>

        {inviteLink ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Share this link with your hunter. It expires in 7 days.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-surface-alt px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-muted font-mono">
                {inviteLink}
              </span>
              <button
                onClick={copyLink}
                className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-light"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Field
              label="Email (optional)"
              error={errors.email?.message}
              theme="light"
            >
              {(id, hasError, theme) => (
                <Input
                  {...register('email')}
                  id={id}
                  type="email"
                  placeholder="friend@example.com"
                  hasError={hasError}
                  theme={theme}
                />
              )}
            </Field>
            <p className="text-xs text-muted">
              If you enter an email, an invitation will be sent automatically.
              Leave it blank to generate a link you can share yourself.
            </p>

            {serverError && (
              <p role="alert" className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
                {serverError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" loading={createInvitation.isPending}>
                Generate invite
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
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
