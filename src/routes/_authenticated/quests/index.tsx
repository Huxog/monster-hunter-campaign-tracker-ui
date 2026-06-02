import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { useQuests } from '../../../features/quests/api';
import { useMonstersAll } from '../../../features/monsters/api';
import { Pagination } from '../../../shared/components/Pagination';
import type { Quest, QuestOutcome } from '../../../features/quests/types';

const searchSchema = z.object({
  monsterId: z.string().uuid().optional().catch(undefined),
  outcome: z.enum(['success', 'failure', 'abandoned']).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/quests/')({
  validateSearch: searchSchema,
  component: QuestsPage,
});

const OUTCOME_FILTERS: { label: string; value: QuestOutcome | undefined }[] = [
  { label: 'All outcomes', value: undefined },
  { label: 'Success', value: 'success' },
  { label: 'Failure', value: 'failure' },
  { label: 'Abandoned', value: 'abandoned' },
];

function QuestsPage() {
  const { monsterId, outcome, page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isPending, isError } = useQuests({ monsterId, outcome, page });
  const { data: monstersData } = useMonstersAll();
  const monsters = monstersData?.data ?? [];

  function setMonsterFilter(id: string) {
    void navigate({
      search: (prev) => ({ ...prev, monsterId: id || undefined, page: undefined }),
      replace: true,
    });
  }

  function setOutcomeFilter(value: QuestOutcome | undefined) {
    void navigate({
      search: (prev) => ({ ...prev, outcome: value, page: undefined }),
      replace: true,
    });
  }

  function setPage(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }),
      replace: true,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-cream">Hunt Log</h1>
        <p className="mt-1 text-sm text-muted">All quests across every campaign.</p>
      </div>

      {/* Monster filter */}
      {monsters.length > 0 && (
        <div className="mb-4">
          <select
            value={monsterId ?? ''}
            onChange={(e) => setMonsterFilter(e.target.value)}
            className="rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-cream focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All monsters</option>
            {monsters.map((m) => (
              <option key={m.id} value={m.id}>
                {'★'.repeat(m.stars)} {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Outcome filter chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {OUTCOME_FILTERS.map((filter) => (
          <FilterChip
            key={filter.label}
            label={filter.label}
            active={outcome === filter.value}
            onClick={() => setOutcomeFilter(filter.value)}
          />
        ))}
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load quests. Please try again.
        </div>
      )}

      {!isPending && !isError && data && data.data.length === 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">No quests match the current filters.</p>
        </div>
      )}

      {!isPending && !isError && data && data.data.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {data.data.map((quest) => (
              <QuestRow key={quest.id} quest={quest} />
            ))}
          </div>
          <div className="mt-5">
            <Pagination meta={data.meta} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quest row ────────────────────────────────────────────────────────────────

function QuestRow({ quest }: { quest: Quest }) {
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
      params={{ campaignId: quest.campaignId, questId: quest.id }}
      className="group flex items-center gap-3 rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-surface-alt"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary/15 bg-surface overflow-hidden">
        {quest.monster?.imagePath ? (
          <img
            src={quest.monster.imagePath}
            alt={quest.monster.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <svg className="h-4 w-4 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-cream group-hover:text-primary transition-colors truncate">
          {quest.monster?.name ?? '—'}
        </span>
        {quest.monster?.stars && (
          <span className="text-xs text-ember">{'★'.repeat(quest.monster.stars)}</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {date && <span className="text-xs text-muted hidden sm:block">{date}</span>}
        <OutcomeBadge outcome={quest.outcome} />
      </div>
    </Link>
  );
}

// ─── Outcome badge ────────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: QuestOutcome | null }) {
  if (!outcome) {
    return <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">In progress</span>;
  }
  const styles: Record<QuestOutcome, string> = {
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

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-primary/20 bg-surface text-muted hover:border-primary/50 hover:text-cream',
      ].join(' ')}
    >
      {label}
    </button>
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
