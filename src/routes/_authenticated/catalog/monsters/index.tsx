import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  monstersQueryOptions,
  monstersAllQueryOptions,
  useCreateMonster,
} from '../../../../features/monsters/api';
import {
  monsterCreateSchema,
  type MonsterCreateInput,
} from '../../../../features/monsters/schemas';
import {
  STAR_VALUES,
  ELEMENTAL_TYPES,
  AILMENT_TYPES,
} from '../../../../features/monsters/types';
import { useMaterials } from '../../../../features/materials/api';
import { useAuthStore } from '../../../../features/auth/store';
import { Button } from '../../../../shared/components/Button';
import { Field, Input, Select } from '../../../../shared/components/Field';
import { ElementIcon } from '../../../../shared/components/ElementIcon';
import { SearchBar } from '../../../../shared/components/SearchBar';
import { Pagination } from '../../../../shared/components/Pagination';
import { ApiError } from '../../../../shared/lib/apiClient';

const searchSchema = z.object({
  stars: z.coerce.number().int().min(1).max(7).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/catalog/monsters/')({
  validateSearch: searchSchema,
  component: MonstersPage,
});

function MonstersPage() {
  const { stars, page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isPending, isError } = useQuery(
    search ? monstersAllQueryOptions() : monstersQueryOptions({ stars, page }),
  );

  function setStarsFilter(value: number | undefined) {
    void navigate({
      search: value ? { stars: value } : {},
      replace: true,
    });
  }

  function setPage(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }),
      replace: true,
    });
  }

  const pageItems = data?.data ?? [];
  const filtered = pageItems.filter(
    (m) =>
      (!search || m.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!search || !stars || m.stars === stars),
  );
  const maxStars = pageItems.length > 0 ? Math.max(...pageItems.map((m) => m.stars)) : 1;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Monsters</h1>
          <p className="mt-1 text-sm text-muted">
            Creatures that roam the hunting grounds.
          </p>
        </div>
        {isAdmin && !showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            + New monster
          </Button>
        )}
      </div>

      {isAdmin && showCreateForm && (
        <div className="mb-6">
          <CreateMonsterForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search monsters…" />
      </div>

      {/* Stars filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          label="All stars"
          active={!stars}
          onClick={() => setStarsFilter(undefined)}
        />
        {STAR_VALUES.map((s) => (
          <FilterChip
            key={s}
            label={`${s} ${'★'.repeat(s)}`}
            active={stars === s}
            onClick={() => setStarsFilter(s)}
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
          Failed to load monsters. Please try again.
        </div>
      )}

      {data && pageItems.length === 0 && !showCreateForm && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No monsters yet.</p>
        </div>
      )}

      {data && pageItems.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No monsters match your search.</p>
        </div>
      )}

      {data && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((monster) => (
            <Link
              key={monster.id}
              to="/catalog/monsters/$monsterId"
              params={{ monsterId: monster.id }}
              className="group flex items-center gap-4 rounded-lg border border-primary/15 bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-alt"
            >
              {monster.imagePath ? (
                <img
                  src={monster.imagePath}
                  alt={monster.name}
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-alt text-xl">
                  🐉
                </div>
              )}
              <span className="min-w-0 flex-1 font-semibold text-cream transition-colors group-hover:text-primary">
                {monster.name}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                {Array.from({ length: monster.stars }, (_, i) => (
                  <span key={i} className="text-xs text-ember">★</span>
                ))}
                {Array.from({ length: maxStars - monster.stars }, (_, i) => (
                  <span key={i} className="text-xs text-muted/30">★</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!search && data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}

// ─── Create monster form ──────────────────────────────────────────────────────

interface CreateMonsterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateMonsterForm({ onSuccess, onCancel }: CreateMonsterFormProps) {
  const createMonster = useCreateMonster();
  const { data: materialsData } = useMaterials();
  const materials = materialsData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MonsterCreateInput>({
    resolver: zodResolver(monsterCreateSchema),
    defaultValues: {
      stars: 1,
      elementalWeaknesses: { Fire: 0, Water: 0, Thunder: 0, Ice: 0, Dragon: 0 },
      ailmentWeaknesses: {
        Poison: 0,
        Paralysis: 0,
        Sleep: 0,
        Stun: 0,
        Blast: 0,
      },
      materials: [],
    },
  });

  const serverError =
    createMonster.error instanceof ApiError
      ? createMonster.error.message
      : null;

  const onSubmit = (data: MonsterCreateInput) => {
    createMonster.mutate(data, { onSuccess });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">New monster</h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        {/* Name + Stars */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name?.message} theme="light">
            {(id, hasError, theme) => (
              <Input
                {...register('name')}
                id={id}
                placeholder="e.g. Rathalos"
                hasError={hasError}
                theme={theme}
              />
            )}
          </Field>
          <Field
            label="Stars (1–7)"
            error={errors.stars?.message}
            theme="light"
          >
            {(id, _hasError, theme) => (
              <Select
                {...register('stars', { valueAsNumber: true })}
                id={id}
                theme={theme}
              >
                {STAR_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {s} {'★'.repeat(s)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        {/* Description + Image */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description (optional)" theme="light">
            {(id, _hasError, theme) => (
              <Input
                {...register('description')}
                id={id}
                placeholder="Brief description"
                theme={theme}
              />
            )}
          </Field>
          <Field label="Image URL (optional)" theme="light">
            {(id, _hasError, theme) => (
              <Input
                {...register('imagePath')}
                id={id}
                placeholder="https://..."
                theme={theme}
              />
            )}
          </Field>
        </div>

        {/* Elemental weaknesses */}
        <div>
          <p className="mb-2 text-sm font-medium text-cream/80">
            Elemental weaknesses{' '}
            <span className="font-normal text-muted">
              (0 = none, 3 = extreme)
            </span>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {ELEMENTAL_TYPES.map((el) => (
              <div key={el} className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-xs font-medium text-cream/70">
                  <ElementIcon element={el} className="h-3.5 w-3.5" />
                  {el}
                </span>
                <Select
                  {...register(`elementalWeaknesses.${el}` as const, {
                    valueAsNumber: true,
                  })}
                  theme="light"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Ailment weaknesses */}
        <div>
          <p className="mb-2 text-sm font-medium text-cream/80">
            Ailment weaknesses{' '}
            <span className="font-normal text-muted">
              (0 = none, 3 = extreme)
            </span>
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {AILMENT_TYPES.map((ail) => (
              <div key={ail} className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-xs font-medium text-cream/70">
                  <ElementIcon element={ail} className="h-3.5 w-3.5" />
                  {ail}
                </span>
                <Select
                  {...register(`ailmentWeaknesses.${ail}` as const, {
                    valueAsNumber: true,
                  })}
                  theme="light"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Material drops */}
        {materials.length > 0 && (
          <MaterialsMultiSelect
            control={control}
            materials={materials}
          />
        )}

        {serverError && (
          <p
            role="alert"
            className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember"
          >
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={createMonster.isPending}>
            Create monster
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Materials multi-select ───────────────────────────────────────────────────

interface MaterialsMultiSelectProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  materials: { id: string; name: string }[];
}

function MaterialsMultiSelect({
  control,
  materials,
}: MaterialsMultiSelectProps) {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium text-cream/80">
        Material drops{' '}
        <span className="font-normal text-muted">(optional)</span>
      </span>
      <Controller
        name="materials"
        control={control}
        render={({ field }) => {
          const selected: string[] = field.value ?? [];
          return (
            <div
              role="group"
              aria-labelledby={labelId}
              className="flex max-h-40 flex-col gap-0.5 overflow-y-auto rounded-md border border-primary/20 bg-surface-alt p-2"
            >
              {materials.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-surface-alt"
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={selected.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        field.onChange([...selected, m.id]);
                      } else {
                        field.onChange(selected.filter((id) => id !== m.id));
                      }
                    }}
                  />
                  <span className="text-cream">{m.name}</span>
                </label>
              ))}
            </div>
          );
        }}
      />
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
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
