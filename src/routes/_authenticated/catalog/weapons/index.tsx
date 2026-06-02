import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  weaponsQueryOptions,
  weaponsAllQueryOptions,
  useCreateWeapon,
} from '../../../../features/weapons/api';
import { useMaterialsAll } from '../../../../features/materials/api';
import { RecipeEditor } from '../../../../shared/components/RecipeEditor';
import {
  weaponCreateSchema,
  type WeaponCreateInput,
} from '../../../../features/weapons/schemas';
import {
  WEAPON_CLASSES,
  ELEMENTAL_TYPES,
} from '../../../../features/weapons/types';
import { useAuthStore } from '../../../../features/auth/store';
import { Button } from '../../../../shared/components/Button';
import { Badge } from '../../../../shared/components/Badge';
import { Field, Input, Select } from '../../../../shared/components/Field';
import { SearchBar } from '../../../../shared/components/SearchBar';
import { Pagination } from '../../../../shared/components/Pagination';
import { ElementIcon } from '../../../../shared/components/ElementIcon';
import { WeaponClassIcon } from '../../../../shared/components/WeaponClassIcon';
import { ApiError } from '../../../../shared/lib/apiClient';

const searchSchema = z.object({
  class: z.enum(WEAPON_CLASSES).optional().catch(undefined),
  element: z.enum(ELEMENTAL_TYPES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/catalog/weapons/')({
  validateSearch: searchSchema,
  component: WeaponsPage,
});

function WeaponsPage() {
  const { class: weaponClass, element, page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isPending, isError } = useQuery(
    search
      ? weaponsAllQueryOptions()
      : weaponsQueryOptions({ class: weaponClass, element, page }),
  );

  function setFilter(key: 'class' | 'element', value: string | undefined) {
    void navigate({
      search: (prev) => ({ ...prev, [key]: value, page: undefined }),
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
    (w) =>
      (!search || w.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!search || !weaponClass || w.class === weaponClass) &&
      (!search || !element || w.element === element),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Weapons</h1>
          <p className="mt-1 text-sm text-muted">
            Weapon catalog with crafting recipes.
          </p>
        </div>
        {isAdmin && !showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            + New weapon
          </Button>
        )}
      </div>

      {isAdmin && showCreateForm && (
        <div className="mb-6">
          <CreateWeaponForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search weapons…" />
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Class:</span>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              label="All"
              active={!weaponClass}
              onClick={() => setFilter('class', undefined)}
            />
            {WEAPON_CLASSES.map((c) => (
              <FilterChip
                key={c}
                label={
                  <span className="flex items-center gap-1">
                    <WeaponClassIcon weaponClass={c} className="h-3.5 w-3.5" />
                    {c}
                  </span>
                }
                active={weaponClass === c}
                onClick={() => setFilter('class', c)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <span className="text-xs font-medium text-muted self-center">Element:</span>
        <FilterChip
          label="All"
          active={!element}
          onClick={() => setFilter('element', undefined)}
        />
        {ELEMENTAL_TYPES.map((el) => (
          <FilterChip
            key={el}
            label={
              <span className="flex items-center gap-1">
                <ElementIcon element={el} className="h-3.5 w-3.5" />
                {el}
              </span>
            }
            active={element === el}
            onClick={() => setFilter('element', el)}
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
          Failed to load weapons. Please try again.
        </div>
      )}

      {data && pageItems.length === 0 && !showCreateForm && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No weapons yet.</p>
        </div>
      )}

      {data && pageItems.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No weapons match your search.</p>
        </div>
      )}

      {data && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((weapon) => (
            <Link
              key={weapon.id}
              to="/catalog/weapons/$weaponId"
              params={{ weaponId: weapon.id }}
              className="group flex items-center gap-4 rounded-lg border border-primary/15 bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-alt"
            >
              {weapon.imagePath ? (
                <img
                  src={weapon.imagePath}
                  alt={weapon.name}
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-alt">
                  <svg className="h-6 w-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
              )}
              <span className="min-w-0 flex-1 font-semibold text-cream transition-colors group-hover:text-primary">
                {weapon.name}
              </span>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-xs font-medium text-muted">
                  <WeaponClassIcon weaponClass={weapon.class} className="h-3.5 w-3.5" />
                  {weapon.class}
                </span>
                {weapon.element !== 'None' && (
                  <Badge variant="primary">
                    <span className="flex items-center gap-1">
                      <ElementIcon element={weapon.element} className="h-3 w-3" />
                      {weapon.element}
                    </span>
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!search && data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}

// ─── Create weapon form ───────────────────────────────────────────────────────

interface CreateWeaponFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DAMAGE_LABELS = ['1 dmg', '2 dmg', '3 dmg', '4 dmg'] as const;

function CreateWeaponForm({ onSuccess, onCancel }: CreateWeaponFormProps) {
  const createWeapon = useCreateWeapon();
  const { data: materialsData } = useMaterialsAll();
  const materials = materialsData?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WeaponCreateInput>({
    resolver: zodResolver(weaponCreateSchema),
    defaultValues: {
      element: 'None',
      damage: [0, 0, 0, 0],
      materials: [],
    },
  });

  const serverError =
    createWeapon.error instanceof ApiError
      ? createWeapon.error.message
      : null;

  const onSubmit = (data: WeaponCreateInput) => {
    createWeapon.mutate(data, { onSuccess });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">New weapon</h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        {/* Name */}
        <Field label="Name" error={errors.name?.message} theme="light">
          {(id, hasError, theme) => (
            <Input
              {...register('name')}
              id={id}
              placeholder="e.g. Rathalos Sword"
              hasError={hasError}
              theme={theme}
            />
          )}
        </Field>

        {/* Class + Element */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-cream/80">
              Weapon class
              {errors.class && (
                <span className="ml-2 text-xs font-normal text-red-600">{errors.class.message}</span>
              )}
            </span>
            <Controller
              name="class"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5">
                  {WEAPON_CLASSES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={[
                        'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                        field.value === c
                          ? 'bg-primary text-white'
                          : 'border border-primary/20 bg-surface text-cream/70 hover:border-gray-400',
                      ].join(' ')}
                    >
                      <WeaponClassIcon weaponClass={c} className="h-3.5 w-3.5" />
                      {c}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-cream/80">Element</span>
            <Controller
              name="element"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-1.5">
                  {ELEMENTAL_TYPES.map((el) => (
                    <button
                      key={el}
                      type="button"
                      onClick={() => field.onChange(el)}
                      className={[
                        'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                        field.value === el
                          ? 'bg-primary text-white'
                          : 'border border-primary/20 bg-surface text-cream/70 hover:border-gray-400',
                      ].join(' ')}
                    >
                      <ElementIcon element={el} className="h-3.5 w-3.5" />
                      {el}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        {/* Image path */}
        <Field label="Image URL (optional)" error={errors.imagePath?.message} theme="light">
          {(id, hasError, theme) => (
            <Input
              {...register('imagePath')}
              id={id}
              placeholder="https://..."
              hasError={hasError}
              theme={theme}
            />
          )}
        </Field>

        {/* Damage deck */}
        <div>
          <p className="mb-2 text-sm font-medium text-cream/80">
            Damage deck{' '}
            <span className="font-normal text-muted">
              (number of cards at each damage value)
            </span>
          </p>
          <div className="grid grid-cols-4 gap-3">
            {DAMAGE_LABELS.map((label, i) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cream/70">
                  {label}
                </span>
                <Input
                  {...register(`damage.${i as 0 | 1 | 2 | 3}`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min={0}
                  placeholder="0"
                  theme="light"
                />
              </div>
            ))}
          </div>
          {errors.damage && (
            <p className="mt-1 text-xs text-red-600">
              All damage values must be 0 or greater.
            </p>
          )}
        </div>

        {/* Crafting recipe */}
        <div>
          <p className="mb-2 text-sm font-medium text-cream/80">
            Crafting recipe{' '}
            <span className="font-normal text-muted">(optional)</span>
          </p>
          <Controller
            name="materials"
            control={control}
            render={({ field }) => (
              <RecipeEditor
                value={field.value ?? []}
                onChange={field.onChange}
                materials={materials}
              />
            )}
          />
        </div>

        {serverError && (
          <p
            role="alert"
            className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember"
          >
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="sm" loading={createWeapon.isPending}>
            Create weapon
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
  label: React.ReactNode;
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
