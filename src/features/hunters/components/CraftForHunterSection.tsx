import { useState, useRef, useEffect } from 'react';
import { useHunters, useHunter, useCraft } from '../api';
import { Button } from '../../../shared/components/Button';
import { ApiError } from '../../../shared/lib/apiClient';
import type { WeaponClass } from '../../weapons/types';

export interface CraftForHunterSectionProps {
  craftableType: 'weapon' | 'equipment';
  craftableId: string;
  craftableClass: WeaponClass;
  recipe: { id: string; name: string; quantity: number }[];
}

export function CraftForHunterSection({
  craftableType,
  craftableId,
  craftableClass,
  recipe,
}: CraftForHunterSectionProps) {
  const [selectedHunterId, setSelectedHunterId] = useState<string | null>(null);
  const [selectedHunterName, setSelectedHunterName] = useState('');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [craftSuccess, setCraftSuccess] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  const { data: huntersData } = useHunters();
  const hunters = huntersData?.data ?? [];

  const { data: selectedHunter, isPending: hunterLoading } = useHunter(
    selectedHunterId ?? '',
    !!selectedHunterId,
  );

  const craft = useCraft(selectedHunterId ?? '');

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const filtered = hunters.filter(
    (h) =>
      h.class === craftableClass &&
      (h.hunterName.toLowerCase().includes(search.toLowerCase()) ||
        h.playerName.toLowerCase().includes(search.toLowerCase())),
  );

  function selectHunter(hunterId: string, hunterName: string) {
    setSelectedHunterId(hunterId);
    setSelectedHunterName(hunterName);
    setSearch('');
    setDropdownOpen(false);
    setCraftSuccess(false);
    craft.reset();
  }

  function clearSelection() {
    setSelectedHunterId(null);
    setSelectedHunterName('');
    setCraftSuccess(false);
    craft.reset();
  }

  const lootMap = new Map((selectedHunter?.loot ?? []).map((l) => [l.id, l.quantity]));

  const requirements = recipe.map((req) => ({
    ...req,
    have: lootMap.get(req.id) ?? 0,
    sufficient: (lootMap.get(req.id) ?? 0) >= req.quantity,
  }));

  const canCraft = !!selectedHunter && !hunterLoading && requirements.every((r) => r.sufficient);
  const serverError = craft.error instanceof ApiError ? craft.error.message : null;

  function handleCraft() {
    if (!selectedHunterId) return;
    craft.mutate(
      { craftableType, craftableId },
      { onSuccess: () => setCraftSuccess(true) },
    );
  }

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Craft for hunter
      </h2>

      <div className="rounded-lg border border-primary/15 bg-surface p-4">
        {/* Hunter selector */}
        <div ref={comboRef} className="relative mb-4">
          {selectedHunterId ? (
            <div className="flex items-center justify-between rounded border border-primary/20 px-3 py-2">
              <span className="text-sm text-cream">{selectedHunterName}</span>
              <button
                onClick={clearSelection}
                className="text-muted transition-colors hover:text-ember"
                aria-label="Clear selection"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Select a hunter…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                className="w-full rounded border border-primary/20 bg-surface-alt px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-primary/50 focus:outline-none"
              />
              {dropdownOpen && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded border border-primary/20 bg-surface shadow-lg">
                  {filtered.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted">No hunters found</li>
                  ) : (
                    filtered.map((h) => (
                      <li
                        key={h.id}
                        onClick={() => selectHunter(h.id, h.hunterName)}
                        className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-cream hover:bg-primary/10"
                      >
                        <span>{h.hunterName}</span>
                        <span className="text-xs text-muted">{h.playerName}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Recipe vs loot */}
        {selectedHunterId && (
          <>
            {hunterLoading ? (
              <div className="mb-4 space-y-2">
                {recipe.map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-primary/10" />
                ))}
              </div>
            ) : (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Materials
                </p>
                <ul className="flex flex-col gap-1.5">
                  {requirements.map((req) => (
                    <li key={req.id} className="flex items-center justify-between text-sm">
                      <span className="text-cream">{req.name}</span>
                      <span
                        className={[
                          'font-medium tabular-nums',
                          req.sufficient ? 'text-green-600' : 'text-ember',
                        ].join(' ')}
                      >
                        {req.have} / {req.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {craftSuccess && (
              <p className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                Crafted successfully! Check the hunter's inventory.
              </p>
            )}

            {serverError && (
              <p
                role="alert"
                className="mb-3 rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember"
              >
                {serverError}
              </p>
            )}

            <Button
              size="sm"
              onClick={handleCraft}
              disabled={!canCraft || craftSuccess}
              loading={craft.isPending}
            >
              Craft
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
