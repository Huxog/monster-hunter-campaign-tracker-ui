import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useHunter,
  useUpdateHunter,
  useDeleteHunter,
  useEquip,
  useAddLoot,
  useUpdateLoot,
  useRemoveLoot,
  useCraftables,
  useCraft,
  type EquipSlot,
} from '../../../features/hunters/api';
import { useMaterialsAll } from '../../../features/materials/api';
import type { Material } from '../../../features/materials/types';
import { hunterUpdateSchema, type HunterUpdateInput } from '../../../features/hunters/schemas';
import { useAuthStore } from '../../../features/auth/store';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Badge } from '../../../shared/components/Badge';
import { Field, Input } from '../../../shared/components/Field';
import { ElementIcon } from '../../../shared/components/ElementIcon';
import { WeaponClassIcon } from '../../../shared/components/WeaponClassIcon';
import { ApiError } from '../../../shared/lib/apiClient';
import type {
  Hunter,
  HunterEquipmentSummary,
  HunterLootEntry,
  HunterWeaponSummary,
} from '../../../features/hunters/types';

export const Route = createFileRoute('/_authenticated/hunters/$hunterId')({
  component: HunterDetailPage,
});

function HunterDetailPage() {
  const { hunterId } = Route.useParams();
  const { data: hunter, isPending, isError } = useHunter(hunterId);
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [equipping, setEquipping] = useState<EquipSlot | null>(null);
  const deleteHunter = useDeleteHunter();
  const navigate = useNavigate();

  const equipWeapon = useEquip(hunterId, 'weapon');
  const equipHelmet = useEquip(hunterId, 'helmet');
  const equipVest = useEquip(hunterId, 'vest');
  const equipTrouser = useEquip(hunterId, 'trouser');
  const equipMutations: Record<EquipSlot, ReturnType<typeof useEquip>> = {
    weapon: equipWeapon,
    helmet: equipHelmet,
    vest: equipVest,
    trouser: equipTrouser,
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !hunter) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load hunter. Please try again.
        </div>
      </div>
    );
  }

  function handleDelete() {
    deleteHunter.mutate(hunterId, {
      onSuccess: () =>
        void navigate({
          to: '/campaigns/$campaignId',
          params: { campaignId: hunter!.campaignId },
        }),
    });
  }

  const campaignName = hunter.campaign?.name ?? '—';

  return (
    <div className="mx-auto max-w-6xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link to="/campaigns" className="hover:text-cream transition-colors">
          Campaigns
        </Link>
        <span>/</span>
        <Link to="/campaigns/$campaignId" params={{ campaignId: hunter.campaignId }} className="hover:text-cream transition-colors">
          {campaignName}
        </Link>
        <span>/</span>
        <span>Hunters</span>
        <span>/</span>
        <span className="text-cream">{hunter.hunterName}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-8">
        {/* Left: character panel */}
        <div className="mb-6 flex flex-col gap-6 lg:sticky lg:top-6 lg:mb-0 lg:self-start">
          {/* Header card */}
          <div className="rounded-lg border border-primary/15 bg-surface p-6">
            {mode === 'edit' ? (
              <EditHunterForm
                hunterId={hunterId}
                defaultValues={{
                  playerName: hunter.playerName,
                  hunterName: hunter.hunterName,
                }}
                onSuccess={() => setMode('view')}
                onCancel={() => setMode('view')}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold text-cream">{hunter.hunterName}</h1>
                      {hunter.class && (
                        <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <WeaponClassIcon weaponClass={hunter.class} className="h-3.5 w-3.5" />
                          {hunter.class}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{hunter.playerName}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
                  {hunter.weapon && hunter.weapon.element !== 'None' && (
                    <Stat label="Element">
                      <span className="flex items-center gap-1 font-medium text-cream">
                        <ElementIcon element={hunter.weapon.element} className="h-3.5 w-3.5" />
                        {hunter.weapon.element}
                      </span>
                    </Stat>
                  )}
                  <Stat label="Armor">
                    <span className="font-semibold text-cream">
                      {(hunter.helmet?.armor ?? 0) + (hunter.vest?.armor ?? 0) + (hunter.trousers?.armor ?? 0)}
                    </span>
                  </Stat>
                  <Stat label="Campaign">
                    <Link
                      to="/campaigns/$campaignId"
                      params={{ campaignId: hunter.campaignId }}
                      className="font-medium text-primary hover:underline"
                    >
                      {campaignName}
                    </Link>
                  </Stat>
                </div>

                <ConfirmDialog
                  open={confirmDelete}
                  title="Delete hunter"
                  description={`Delete "${hunter.hunterName}"? This will remove all their gear, loot, and quest history.`}
                  onConfirm={handleDelete}
                  onCancel={() => setConfirmDelete(false)}
                  isPending={deleteHunter.isPending}
                />
              </>
            )}
          </div>

          {/* Equipped gear */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Equipped gear
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <GearSlot label="Weapon" item={hunter.weapon ?? null} active={equipping === 'weapon'} onEquipClick={() => setEquipping(equipping === 'weapon' ? null : 'weapon')} />
              <GearSlot label="Helmet" item={hunter.helmet ?? null} active={equipping === 'helmet'} onEquipClick={() => setEquipping(equipping === 'helmet' ? null : 'helmet')} />
              <GearSlot label="Vest" item={hunter.vest ?? null} active={equipping === 'vest'} onEquipClick={() => setEquipping(equipping === 'vest' ? null : 'vest')} />
              <GearSlot label="Trousers" item={hunter.trousers ?? null} active={equipping === 'trouser'} onEquipClick={() => setEquipping(equipping === 'trouser' ? null : 'trouser')} />
            </div>

            {equipping && (
              <div className="mt-3">
                <EquipPanel
                  slot={equipping}
                  hunter={hunter}
                  onEquip={(id) => equipMutations[equipping].mutate(id, { onSuccess: () => setEquipping(null) })}
                  isPending={equipMutations[equipping].isPending}
                  onClose={() => setEquipping(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: inventory, craft, loot */}
        <div className="lg:col-span-2">
          <InventorySection hunter={hunter} />
          <CraftSection hunterId={hunterId} />
          <LootSection hunter={hunter} />
        </div>
      </div>
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}

// ─── Gear slot ────────────────────────────────────────────────────────────────

interface GearSlotProps {
  label: string;
  item: HunterEquipmentSummary | HunterWeaponSummary | null;
  active?: boolean;
  onEquipClick?: () => void;
}

function GearSlotIcon({ item }: { item: HunterEquipmentSummary | HunterWeaponSummary | null }) {
  if (item?.imagePath) {
    return <img src={item.imagePath} alt={item.name} className="h-full w-full object-cover" />;
  }
  return (
    <svg
      className={['h-6 w-6', item ? 'text-primary/40' : 'text-primary/15'].join(' ')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {item ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      )}
    </svg>
  );
}

function GearSlot({ label, item, active, onEquipClick }: GearSlotProps) {
  const isEquipment = item !== null && 'type' in item;

  const slotContent = (
    <div className="flex h-16 w-full items-center justify-center rounded border border-primary/10 bg-background overflow-hidden">
      <GearSlotIcon item={item} />
    </div>
  );

  return (
    <div className={['flex flex-col gap-2 rounded-lg border bg-surface p-4 transition-colors', active ? 'border-primary/50' : 'border-primary/15'].join(' ')}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {item ? (
        isEquipment ? (
          <Link
            to="/catalog/equipment/$equipmentId"
            params={{ equipmentId: item.id }}
            className="transition-opacity hover:opacity-70"
          >
            {slotContent}
          </Link>
        ) : (
          <Link
            to="/catalog/weapons/$weaponId"
            params={{ weaponId: item.id }}
            className="transition-opacity hover:opacity-70"
          >
            {slotContent}
          </Link>
        )
      ) : (
        slotContent
      )}
      {item ? (
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs font-medium text-cream">{item.name}</span>
          {'armor' in item && item.armor != null && (
            <span className="shrink-0 text-xs font-semibold text-primary">{item.armor} Armor</span>
          )}
          {'element' in item && item.element !== 'None' && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
              <ElementIcon element={item.element} className="h-3 w-3" />
              {item.element}
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted italic">Empty</span>
      )}
      {onEquipClick && (
        <button
          onClick={onEquipClick}
          className={['rounded px-2 py-1 text-xs font-medium transition-colors', active ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'].join(' ')}
        >
          {item ? 'Change' : 'Equip'}
        </button>
      )}
    </div>
  );
}

// ─── Equip panel ──────────────────────────────────────────────────────────────

interface EquipPanelProps {
  slot: EquipSlot;
  hunter: Hunter;
  onEquip: (equippableId: string) => void;
  isPending: boolean;
  onClose: () => void;
}

function EquipPanel({ slot, hunter, onEquip, isPending, onClose }: EquipPanelProps) {
  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
  const weapons = hunter.inventoryWeapons ?? [];
  const equipment = hunter.inventoryEquipment ?? [];
  const items = slot === 'weapon' ? weapons : equipment.filter((e) => e.type === slot);

  return (
    <div className="rounded-lg border border-primary/30 bg-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-primary/10 px-4 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-primary">
          Select {slotLabel}
        </span>
        <button onClick={onClose} className="text-muted transition-colors hover:text-cream" aria-label="Close">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">
          No {slotLabel.toLowerCase()} in inventory. Craft one first.
        </p>
      ) : (
        <div className="divide-y divide-primary/10">
          {slot === 'weapon'
            ? weapons.map((w) => (
                <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                  <Link
                    to="/catalog/weapons/$weaponId"
                    params={{ weaponId: w.id }}
                    className="min-w-0 flex-1 transition-opacity hover:opacity-70"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-cream">{w.name}</span>
                      {w.element !== 'None' && (
                        <Badge variant="primary">
                          <span className="flex items-center gap-1">
                            <ElementIcon element={w.element} className="h-3 w-3" />
                            {w.element}
                          </span>
                        </Badge>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <WeaponClassIcon weaponClass={w.class} className="h-3 w-3" />
                      {w.class}
                    </span>
                  </Link>
                  <Button size="sm" loading={isPending} onClick={() => onEquip(w.id)}>
                    Equip
                  </Button>
                </div>
              ))
            : equipment
                .filter((e) => e.type === slot)
                .map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <Link
                      to="/catalog/equipment/$equipmentId"
                      params={{ equipmentId: e.id }}
                      className="min-w-0 flex-1 transition-opacity hover:opacity-70"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-cream">{e.name}</span>
                        <Badge variant="muted" className="capitalize">{e.type}</Badge>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <WeaponClassIcon weaponClass={e.class} className="h-3 w-3" />
                        {e.class}
                      </span>
                    </Link>
                    <Button size="sm" loading={isPending} onClick={() => onEquip(e.id)}>
                      Equip
                    </Button>
                  </div>
                ))}
        </div>
      )}
    </div>
  );
}

// ─── Edit hunter form ─────────────────────────────────────────────────────────

interface EditHunterFormProps {
  hunterId: string;
  defaultValues: HunterUpdateInput;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditHunterForm({ hunterId, defaultValues, onSuccess, onCancel }: EditHunterFormProps) {
  const updateHunter = useUpdateHunter(hunterId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HunterUpdateInput>({
    resolver: zodResolver(hunterUpdateSchema),
    defaultValues,
  });

  const serverError = updateHunter.error instanceof ApiError ? updateHunter.error.message : null;

  const onSubmit = (data: HunterUpdateInput) => {
    updateHunter.mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Player name" error={errors.playerName?.message} theme="light">
          {(id, hasError, theme) => (
            <Input {...register('playerName')} id={id} hasError={hasError} theme={theme} />
          )}
        </Field>
        <Field label="Hunter name" error={errors.hunterName?.message} theme="light">
          {(id, hasError, theme) => (
            <Input {...register('hunterName')} id={id} hasError={hasError} theme={theme} />
          )}
        </Field>
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember"
        >
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={updateHunter.isPending}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Inventory section ────────────────────────────────────────────────────────

function InventorySection({ hunter }: { hunter: Hunter }) {
  const [activeTab, setActiveTab] = useState<'weapons' | 'equipment'>('weapons');
  const weapons = hunter.inventoryWeapons ?? [];
  const equipment = hunter.inventoryEquipment ?? [];

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Inventory</h2>
      <div className="rounded-lg border border-primary/15 bg-surface overflow-hidden">
        <div className="flex border-b border-primary/10">
          {(['weapons', 'equipment'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-1 px-4 py-2.5 text-xs font-medium uppercase tracking-wide transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted hover:text-cream',
              ].join(' ')}
            >
              {tab === 'weapons'
                ? `Weapons (${weapons.length})`
                : `Equipment (${equipment.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'weapons' && (
          <>
            {weapons.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-muted">No weapons crafted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {weapons.map((w) => (
                  <Link
                    key={w.id}
                    to="/catalog/weapons/$weaponId"
                    params={{ weaponId: w.id }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-cream">
                          {w.name}
                        </span>
                        {w.element !== 'None' && (
                          <Badge variant="primary">
                            <span className="flex items-center gap-1">
                              <ElementIcon element={w.element} className="h-3 w-3" />
                              {w.element}
                            </span>
                          </Badge>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <WeaponClassIcon weaponClass={w.class} className="h-3 w-3" />
                        {w.class}
                      </span>
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'equipment' && (
          <>
            {equipment.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-muted">No equipment crafted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {equipment.map((e) => (
                  <Link
                    key={e.id}
                    to="/catalog/equipment/$equipmentId"
                    params={{ equipmentId: e.id }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-cream">
                          {e.name}
                        </span>
                        <Badge variant="muted" className="capitalize">
                          {e.type}
                        </Badge>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <WeaponClassIcon weaponClass={e.class} className="h-3 w-3" />
                        {e.class}
                      </span>
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Craft section ────────────────────────────────────────────────────────────

function CraftSection({ hunterId }: { hunterId: string }) {
  const { data: craftables, isPending } = useCraftables(hunterId);
  const craft = useCraft(hunterId);
  const [activeType, setActiveType] = useState<'weapons' | 'equipment'>('weapons');
  const [craftingId, setCraftingId] = useState<string | null>(null);

  const craftableWeapons = craftables?.weapons ?? [];
  const craftableEquipment = craftables?.equipment ?? [];
  const total = craftableWeapons.length + craftableEquipment.length;

  function handleCraft(craftableType: 'weapon' | 'equipment', craftableId: string) {
    setCraftingId(craftableId);
    craft.mutate(
      { craftableType, craftableId },
      { onSuccess: () => setCraftingId(null), onError: () => setCraftingId(null) }
    );
  }

  const craftError = craft.error instanceof ApiError ? craft.error.message : null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Craft</h2>

      {isPending && (
        <div className="rounded-lg border border-primary/15 bg-surface p-4 animate-pulse space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded bg-primary/10" />
          ))}
        </div>
      )}

      {!isPending && total === 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-8 text-center">
          <p className="text-sm text-muted">No items available to craft with current loot.</p>
        </div>
      )}

      {!isPending && total > 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface overflow-hidden">
          <div className="flex border-b border-primary/10">
            {(['weapons', 'equipment'] as const).map((type) => {
              const count =
                type === 'weapons' ? craftableWeapons.length : craftableEquipment.length;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={[
                    'flex-1 px-4 py-2.5 text-xs font-medium uppercase tracking-wide transition-colors',
                    activeType === type
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted hover:text-cream',
                  ].join(' ')}
                >
                  {type === 'weapons' ? `Weapons (${count})` : `Equipment (${count})`}
                </button>
              );
            })}
          </div>

          {craftError && (
            <p
              role="alert"
              className="border-b border-ember/20 bg-ember/10 px-4 py-2 text-sm text-ember"
            >
              {craftError}
            </p>
          )}

          <div className="divide-y divide-primary/10">
            {(activeType === 'weapons' ? craftableWeapons : craftableEquipment).map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-cream">
                      {item.name}
                    </span>
                    {'element' in item && item.element !== 'None' && (
                      <Badge variant="primary">
                        <span className="flex items-center gap-1">
                          <ElementIcon element={item.element} className="h-3 w-3" />
                          {item.element}
                        </span>
                      </Badge>
                    )}
                    {'type' in item && (
                      <Badge variant="muted" className="capitalize">
                        {item.type}
                      </Badge>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <WeaponClassIcon weaponClass={item.class} className="h-3 w-3" />
                    {item.class}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={craftingId === item.id}
                  disabled={craft.isPending}
                  onClick={() =>
                    handleCraft(activeType === 'weapons' ? 'weapon' : 'equipment', item.id)
                  }
                >
                  Craft
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loot section ─────────────────────────────────────────────────────────────

function LootSection({ hunter }: { hunter: Hunter }) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const loot = hunter.loot ?? [];

  const filtered = loot.filter((entry) => entry.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Loot</h2>
        <Button variant="secondary" size="sm" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'Add loot'}
        </Button>
      </div>

      {adding && (
        <AddLootForm hunterId={hunter.id} currentLoot={loot} onDone={() => setAdding(false)} />
      )}

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search materials…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-primary/20 bg-surface-alt px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <div className="rounded-lg border border-primary/15 bg-surface overflow-hidden">
          {loot.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-muted">No loot yet. Add materials to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10 text-left">
                  <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Material
                  </th>
                  <th className="w-28 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Quantity
                  </th>
                  <th className="w-24 px-4 py-2" />
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
                    <LootRow key={entry.id} entry={entry} hunterId={hunter.id} />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loot row ─────────────────────────────────────────────────────────────────

function LootRow({ entry, hunterId }: { entry: HunterLootEntry; hunterId: string }) {
  const [editing, setEditing] = useState(false);
  const [inputQty, setInputQty] = useState(entry.quantity);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const addLoot = useAddLoot(hunterId);
  const updateLoot = useUpdateLoot(hunterId);
  const removeLoot = useRemoveLoot(hunterId);

  const isBusy = addLoot.isPending || updateLoot.isPending || removeLoot.isPending;

  useEffect(() => {
    if (!editing) setInputQty(entry.quantity);
  }, [entry.quantity, editing]);

  function handleSave() {
    const finalQty = Math.max(0, inputQty);
    if (finalQty === entry.quantity) {
      setEditing(false);
      return;
    }
    if (finalQty === 0) {
      removeLoot.mutate(entry.id, { onSuccess: () => setEditing(false) });
    } else if (finalQty > entry.quantity) {
      addLoot.mutate(
        { materialId: entry.id, quantity: finalQty - entry.quantity },
        { onSuccess: () => setEditing(false) }
      );
    } else {
      updateLoot.mutate(
        { materialId: entry.id, quantity: entry.quantity - finalQty },
        { onSuccess: () => setEditing(false) }
      );
    }
  }

  return (
    <tr className="border-b border-primary/10 last:border-0">
      <td className="px-4 py-3 text-cream">{entry.name}</td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            type="number"
            min={0}
            value={inputQty}
            onChange={(e) => setInputQty(Number(e.target.value))}
            className="w-20 rounded border border-primary/20 px-2 py-1 text-sm text-cream focus:border-primary focus:outline-none"
            autoFocus
          />
        ) : (
          <span className="font-medium text-cream">{entry.quantity}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" onClick={handleSave} loading={isBusy}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setInputQty(entry.quantity);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-muted transition-colors hover:text-cream"
              aria-label="Edit quantity"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                />
              </svg>
            </button>
            <button
              onClick={() => setConfirmRemove(true)}
              disabled={isBusy}
              className="text-muted transition-colors hover:text-ember disabled:opacity-40"
              aria-label="Remove from loot"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        )}
      </td>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove loot"
        description={`Remove ${entry.name} from this hunter's loot?`}
        confirmLabel="Remove"
        onConfirm={() => removeLoot.mutate(entry.id, { onSuccess: () => setConfirmRemove(false) })}
        onCancel={() => setConfirmRemove(false)}
        isPending={removeLoot.isPending}
      />
    </tr>
  );
}

// ─── Add loot form ─────────────────────────────────────────────────────────────

interface PendingLootEntry {
  materialId: string;
  name: string;
  quantity: number;
}

function AddLootForm({
  hunterId,
  currentLoot,
  onDone,
}: {
  hunterId: string;
  currentLoot: HunterLootEntry[];
  onDone: () => void;
}) {
  const { data: materialsData, isPending: loadingMaterials } = useMaterialsAll();
  const allMaterials = materialsData?.data ?? [];
  const addLoot = useAddLoot(hunterId);

  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pending, setPending] = useState<PendingLootEntry[]>([]);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const filtered = allMaterials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      !pending.some((p) => p.materialId === m.id)
  );

  function selectMaterial(material: Material) {
    setPending((prev) => [...prev, { materialId: material.id, name: material.name, quantity: 1 }]);
    setSearch('');
    setDropdownOpen(false);
  }

  function updatePendingQty(materialId: string, qty: number) {
    setPending((prev) =>
      prev.map((p) => (p.materialId === materialId ? { ...p, quantity: Math.max(1, qty) } : p))
    );
  }

  function removePending(materialId: string) {
    setPending((prev) => prev.filter((p) => p.materialId !== materialId));
  }

  async function handleSubmit() {
    if (pending.length === 0) return;
    await Promise.all(
      pending.map((p) => addLoot.mutateAsync({ materialId: p.materialId, quantity: p.quantity }))
    );
    onDone();
  }

  const existingQty = (materialId: string) =>
    currentLoot.find((l) => l.id === materialId)?.quantity ?? null;

  return (
    <div className="mb-4 rounded-lg border border-primary/15 bg-surface p-4">
      <div ref={comboRef} className="relative mb-3">
        <input
          type="text"
          placeholder="Search materials…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          className="w-full rounded border border-primary/20 px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-primary focus:outline-none"
        />
        {dropdownOpen && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded border border-primary/20 bg-surface shadow-lg">
            {loadingMaterials ? (
              <li className="px-3 py-2 text-sm text-muted">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No materials found</li>
            ) : (
              filtered.map((m) => {
                const qty = existingQty(m.id);
                return (
                  <li
                    key={m.id}
                    onClick={() => selectMaterial(m)}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-cream hover:bg-primary/5"
                  >
                    <span>{m.name}</span>
                    {qty !== null && <span className="text-xs text-muted">{qty} in loot</span>}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {pending.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {pending.map((p) => (
            <li key={p.materialId} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-cream">{p.name}</span>
              <input
                type="number"
                min={1}
                value={p.quantity}
                onChange={(e) => updatePendingQty(p.materialId, Number(e.target.value))}
                className="w-20 rounded border border-primary/20 px-2 py-1 text-sm text-cream focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => removePending(p.materialId)}
                className="text-muted transition-colors hover:text-ember"
                aria-label={`Remove ${p.name}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={pending.length === 0}
        loading={addLoot.isPending}
      >
        Add{' '}
        {pending.length > 0 ? `${pending.length} material${pending.length > 1 ? 's' : ''}` : 'loot'}
      </Button>
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
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
