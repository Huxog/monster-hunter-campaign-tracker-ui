import { createFileRoute, Link } from '@tanstack/react-router';
import { useCampaigns } from '../../features/campaigns/api';
import { useHunters } from '../../features/hunters/api';
import { useQuests } from '../../features/quests/api';
import { WeaponClassIcon } from '../../shared/components/WeaponClassIcon';
import type { Quest } from '../../features/quests/types';
import type { Hunter } from '../../features/hunters/types';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: campaignsData } = useCampaigns();
  const { data: huntersData } = useHunters();
  const { data: questsData } = useQuests();

  const campaigns = campaignsData?.data ?? [];
  const hunters = huntersData?.data ?? [];
  const quests = questsData?.data ?? [];
  const recentQuests = quests.slice(-8).reverse();

  const campaignTotal = campaignsData?.meta.total ?? 0;
  const hunterTotal = huntersData?.meta.total ?? 0;
  const questTotal = questsData?.meta.total ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cream">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Your hunting campaigns at a glance.</p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard
          label="Campaigns"
          value={campaignTotal}
          href="/campaigns"
          icon={<CampaignIcon />}
        />
        <StatCard
          label="Hunters"
          value={hunterTotal}
          href="/hunters"
          icon={<HunterIcon />}
        />
        <StatCard
          label="Quests"
          value={questTotal}
          href="/quests"
          icon={<QuestIcon />}
        />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Recent quests — 2/3 width */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Recent Quests
            </h2>
            <Link to="/quests" className="text-xs text-primary hover:text-primary-light transition-colors">
              View all →
            </Link>
          </div>

          {questsData && recentQuests.length === 0 ? (
            <EmptyState message="No quests logged yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {recentQuests.map((quest) => (
                <RecentQuestRow key={quest.id} quest={quest} />
              ))}
              {!questsData && <QuestRowSkeleton />}
            </div>
          )}
        </section>

        {/* Party overview — 1/3 width */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Party
            </h2>
            <Link to="/hunters" className="text-xs text-primary hover:text-primary-light transition-colors">
              View all →
            </Link>
          </div>

          {huntersData && hunters.length === 0 ? (
            <EmptyState message="No hunters yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {hunters.slice(0, 8).map((hunter) => (
                <PartyMemberRow key={hunter.id} hunter={hunter} campaigns={campaigns} />
              ))}
              {!huntersData && (
                <>
                  <PartySkeleton />
                  <PartySkeleton />
                  <PartySkeleton />
                </>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, href, icon }: StatCardProps) {
  return (
    <Link
      to={href as never}
      className="group flex items-center gap-4 rounded-lg border border-primary/15 bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-surface-alt"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-cream">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Link>
  );
}

// ─── Recent quest row ─────────────────────────────────────────────────────────

function RecentQuestRow({ quest }: { quest: Quest }) {
  const date = quest.completedAt
    ? new Date(quest.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date(quest.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  return (
    <Link
      to="/campaigns/$campaignId/quests/$questId"
      params={{ campaignId: quest.campaignId, questId: quest.id }}
      className="group flex items-center gap-3 rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-surface-alt"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary/15 bg-background overflow-hidden">
        {quest.monster?.imagePath ? (
          <img src={quest.monster.imagePath} alt={quest.monster.name} className="h-full w-full object-cover" />
        ) : (
          <svg className="h-4 w-4 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-cream group-hover:text-primary transition-colors">
          {quest.monster?.name ?? 'Unknown monster'}
        </p>
        <p className="text-xs text-muted">{date}</p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {quest.monster?.stars && (
          <span className="text-xs text-ember">{'★'.repeat(quest.monster.stars)}</span>
        )}
        <OutcomeChip outcome={quest.outcome} />
      </div>
    </Link>
  );
}

// ─── Party member row ─────────────────────────────────────────────────────────

function PartyMemberRow({ hunter, campaigns }: { hunter: Hunter; campaigns: { id: string; name: string }[] }) {
  const campaignName = campaigns.find((c) => c.id === hunter.campaignId)?.name;

  return (
    <Link
      to="/hunters/$hunterId"
      params={{ hunterId: hunter.id }}
      className="group flex items-center gap-3 rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-surface-alt"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-cream group-hover:text-primary transition-colors">
          {hunter.hunterName}
        </p>
        {campaignName && (
          <p className="truncate text-xs text-muted">{campaignName}</p>
        )}
      </div>
      {hunter.class && (
        <span className="flex shrink-0 items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
          <WeaponClassIcon weaponClass={hunter.class} className="h-3 w-3" />
          {hunter.class}
        </span>
      )}
    </Link>
  );
}

// ─── Outcome chip ─────────────────────────────────────────────────────────────

function OutcomeChip({ outcome }: { outcome: 'success' | 'failure' | 'abandoned' | null }) {
  if (!outcome) {
    return <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Active</span>;
  }
  const styles = {
    success:   'bg-green-900/40 text-green-300',
    failure:   'bg-ember/20 text-ember',
    abandoned: 'bg-surface-alt text-muted',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[outcome]}`}>
      {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-primary/15 bg-surface px-6 py-8 text-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function QuestRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-surface px-4 py-3 animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded border border-primary/10 bg-primary/5" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 rounded bg-primary/10" />
        <div className="h-3 w-20 rounded bg-primary/5" />
      </div>
      <div className="h-5 w-14 rounded bg-primary/10" />
    </div>
  );
}

function PartySkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-surface px-4 py-3 animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-24 rounded bg-primary/10" />
        <div className="h-3 w-16 rounded bg-primary/5" />
      </div>
      <div className="h-5 w-20 rounded bg-primary/10" />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CampaignIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function HunterIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function QuestIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
    </svg>
  );
}
