import { useNavigate } from '@tanstack/react-router';
import { useQuests } from '../../quests/api';
import { useMonster } from '../../monsters/api';
import { ElementIcon } from '../../../shared/components/ElementIcon';
import type { Hunter } from '../types';
import type { Quest } from '../../quests/types';

export interface HunterCardProps {
  hunter: Hunter;
  campaignName?: string;
}

export function HunterCard({ hunter, campaignName }: HunterCardProps) {
  const navigate = useNavigate();
  const { data: questsData } = useQuests({ campaignId: hunter.campaignId });
  const recentQuests = questsData?.data.slice(-1) ?? [];

  function handleClick() {
    void navigate({
      to: '/campaigns/$campaignId',
      params: { campaignId: hunter.campaignId },
    });
  }

  return (
    <button
      onClick={handleClick}
      className="group w-full text-left rounded-lg border border-primary/15 bg-surface transition-colors hover:border-primary/40 hover:bg-surface-alt"
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">

        {/* ── Section 1: Hunter info ───────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 p-4 sm:w-44 sm:shrink-0 sm:flex-col sm:justify-start sm:gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-cream group-hover:text-primary transition-colors truncate">
              {hunter.hunterName}
            </h3>
            {campaignName && (
              <p className="mt-0.5 text-xs text-muted truncate">{campaignName}</p>
            )}
          </div>
          <WeaponClassBadge weaponClass={hunter.class} />
        </div>

        {/* ── Separator ─────────────────────────────────────────────────── */}
        <div className="mx-4 border-t border-primary/10 sm:mx-0 sm:border-t-0 sm:border-l" />

        {/* ── Section 2: Equipment slots ────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2 p-4">
          <EquipmentSlot
            hasItem={Boolean(hunter.weapon)}
            imagePath={hunter.weapon?.imagePath}
            sublabel={
              hunter.weapon && hunter.weapon.element !== 'None'
                ? <span className="flex items-center gap-0.5"><ElementIcon element={hunter.weapon.element} className="h-3 w-3" />{hunter.weapon.element}</span>
                : null
            }
          />
          <EquipmentSlot
            hasItem={Boolean(hunter.helmet)}
            imagePath={hunter.helmet?.imagePath}
            sublabel={hunter.helmet?.armor != null ? `${hunter.helmet.armor}` : null}
          />
          <EquipmentSlot
            hasItem={Boolean(hunter.vest)}
            imagePath={hunter.vest?.imagePath}
            sublabel={hunter.vest?.armor != null ? `${hunter.vest.armor}` : null}
          />
          <EquipmentSlot
            hasItem={Boolean(hunter.trousers)}
            imagePath={hunter.trousers?.imagePath}
            sublabel={hunter.trousers?.armor != null ? `${hunter.trousers.armor}` : null}
          />
        </div>

        {/* ── Separator ─────────────────────────────────────────────────── */}
        <div className="mx-4 border-t border-primary/10 sm:mx-0 sm:border-t-0 sm:border-l" />

        {/* ── Section 3: Recent quests ──────────────────────────────────── */}
        <div className="flex flex-1 flex-col justify-center gap-2 p-4">
          {recentQuests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} />
          ))}
          {recentQuests.length === 0 && questsData && (
            <p className="text-xs text-muted italic">No quests yet.</p>
          )}
        </div>

      </div>
    </button>
  );
}

// ─── Weapon class badge ───────────────────────────────────────────────────────

function WeaponClassBadge({ weaponClass }: { weaponClass: string | null }) {
  return (
    <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap">
      {weaponClass ?? '—'}
    </span>
  );
}

// ─── Equipment slot ───────────────────────────────────────────────────────────

interface EquipmentSlotProps {
  hasItem: boolean;
  imagePath?: string | null;
  sublabel?: React.ReactNode;
}

function EquipmentSlot({ hasItem, imagePath, sublabel }: EquipmentSlotProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-12 w-12 items-center justify-center rounded border border-primary/15 bg-background overflow-hidden">
        {imagePath ? (
          <img src={imagePath} alt="" className="h-full w-full object-cover" />
        ) : (
          <SlotIcon hasItem={hasItem} />
        )}
      </div>
      {sublabel != null ? (
        <span className="text-[10px] font-medium text-primary">{sublabel}</span>
      ) : (
        <span className="text-[10px] text-muted/40">—</span>
      )}
    </div>
  );
}

function SlotIcon({ hasItem }: { hasItem: boolean }) {
  if (!hasItem) {
    return (
      <svg className="h-5 w-5 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Quest row ────────────────────────────────────────────────────────────────

function QuestRow({ quest }: { quest: Quest }) {
  const { data: monster } = useMonster(quest.monsterId);

  const date = quest.completedAt
    ? new Date(quest.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-primary/15 bg-background overflow-hidden">
        {monster?.imagePath ? (
          <img src={monster.imagePath} alt={monster.name} className="h-full w-full object-cover" />
        ) : (
          <svg className="h-5 w-5 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        )}
      </div>
      <div className="flex flex-1 min-w-0 items-center justify-between gap-2">
        <span className="text-xs font-medium text-cream truncate">
          {monster?.name ?? '…'}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <OutcomeChip outcome={quest.outcome} />
          {date && <span className="text-xs text-muted">{date}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Outcome chip ─────────────────────────────────────────────────────────────

function OutcomeChip({ outcome }: { outcome: 'success' | 'failure' | 'abandoned' | null }) {
  const config = {
    success:   { label: 'Success',     className: 'bg-green-900/40 text-green-300' },
    failure:   { label: 'Failure',     className: 'bg-ember/20 text-ember' },
    abandoned: { label: 'Abandoned',   className: 'bg-surface-alt text-muted' },
    null:      { label: 'In progress', className: 'bg-primary/10 text-primary' },
  };
  const { label, className } = config[outcome ?? 'null'];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
}
