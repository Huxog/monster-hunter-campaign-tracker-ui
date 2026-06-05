import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  equipmentListQueryOptions,
  equipmentAllQueryOptions,
  useCreateEquipment,
} from '../../../../features/equipment/api';
import { useMaterialsAll } from '../../../../features/materials/api';
import { RecipeEditor } from '../../../../shared/components/RecipeEditor';
import {
  equipmentCreateSchema,
  type EquipmentCreateInput,
} from '../../../../features/equipment/schemas';
import { EQUIPMENT_TYPES } from '../../../../features/equipment/types';
import { WEAPON_CLASSES } from '../../../../features/weapons/types';
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
  type: z.enum(EQUIPMENT_TYPES).optional().catch(undefined),
  class: z.enum(WEAPON_CLASSES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/catalog/equipment/')({
  validateSearch: searchSchema,
  component: EquipmentPage,
});

function EquipmentPage() {
  const { type, class: weaponClass, page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isPending, isError } = useQuery(
    search
      ? equipmentAllQueryOptions()
      : equipmentListQueryOptions({ type, class: weaponClass, page }),
  );

  function setFilter(key: 'type' | 'class', value: string | undefined) {
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
    (e) =>
      (!search || e.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!search || !type || e.type === type) &&
      (!search || !weaponClass || e.class === weaponClass),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Equipment</h1>
          <p className="mt-1 text-sm text-muted">
            Armor and gear with crafting recipes.
          </p>
        </div>
        {isAdmin && !showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            + New equipment
          </Button>
        )}
      </div>

      {isAdmin && showCreateForm && (
        <div className="mb-6">
          <CreateEquipmentForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Search + Filters — fixed at bottom on mobile, normal flow on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-primary/15 bg-background lg:static lg:mb-5 lg:border-0 lg:bg-transparent">
        <div className="mx-auto max-w-4xl flex flex-col gap-4 px-4 pb-4 pt-3 lg:px-0 lg:pb-0 lg:pt-0">
          <SearchBar value={search} onChange={setSearch} placeholder="Search equipment…" />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted">Class</span>
              {weaponClass && (
                <WeaponClassIcon weaponClass={weaponClass} className="h-3.5 w-3.5 shrink-0 text-muted" />
              )}
              <Select
                value={weaponClass ?? ''}
                onChange={(e) => setFilter('class', e.target.value || undefined)}
                className="w-auto"
              >
                <option value="">All</option>
                {WEAPON_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted">Type</span>
              <Select
                value={type ?? ''}
                onChange={(e) => setFilter('type', e.target.value || undefined)}
                className="w-auto"
              >
                <option value="">All</option>
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* List + Pagination — bottom padding on mobile clears the fixed bar */}
      <div className="flex flex-col gap-3 pb-36 lg:pb-0">
          {isPending && (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner />
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
              Failed to load equipment. Please try again.
            </div>
          )}

          {data && pageItems.length === 0 && !showCreateForm && (
            <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
              <p className="text-muted">No equipment yet.</p>
            </div>
          )}

          {data && pageItems.length > 0 && filtered.length === 0 && (
            <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
              <p className="text-muted">No equipment matches your search.</p>
            </div>
          )}

          {data && filtered.length > 0 &&
            filtered.map((equip) => (
              <Link
                key={equip.id}
                to="/catalog/equipment/$equipmentId"
                params={{ equipmentId: equip.id }}
                className="group flex items-center gap-4 rounded-lg border border-primary/15 bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-surface-alt"
              >
                {equip.imagePath ? (
                  <img
                    src={equip.imagePath}
                    alt={equip.name}
                    className="h-12 w-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-alt">
                    <svg className="h-6 w-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                )}
                <span className="min-w-0 flex-1 font-semibold text-cream transition-colors group-hover:text-primary">
                  {equip.name}
                </span>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-muted">
                    <WeaponClassIcon weaponClass={equip.class} className="h-3.5 w-3.5" />
                    {equip.class}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {equip.armor != null && (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-cream">
                        <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        {equip.armor}
                      </span>
                    )}
                    <Badge variant="muted" className="capitalize">{equip.type}</Badge>
                  </div>
                </div>
              </Link>
            ))
          }

          {!search && data && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
    </div>
  );
}

// ─── Create equipment form ────────────────────────────────────────────────────

interface CreateEquipmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const RESISTANCE_ELEMENTS = [
  'fire',
  'ice',
  'thunder',
  'water',
  'dragon',
] as const;

function CreateEquipmentForm({
  onSuccess,
  onCancel,
}: CreateEquipmentFormProps) {
  const createEquipment = useCreateEquipment();
  const { data: materialsData } = useMaterialsAll();
  const materials = materialsData?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentCreateInput>({
    resolver: zodResolver(equipmentCreateSchema),
    defaultValues: {
      elementalResistances: {
        fire: 0,
        ice: 0,
        thunder: 0,
        water: 0,
        dragon: 0,
      },
      materials: [],
    },
  });

  const serverError =
    createEquipment.error instanceof ApiError
      ? createEquipment.error.message
      : null;

  const onSubmit = (data: EquipmentCreateInput) => {
    createEquipment.mutate(data, { onSuccess });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">New equipment</h3>
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
              placeholder="e.g. Rathalos Helm"
              hasError={hasError}
              theme={theme}
            />
          )}
        </Field>

        {/* Type */}
        <Field
          label="Equipment type"
          error={errors.type?.message}
          theme="light"
        >
          {(id, _hasError, theme) => (
            <Select {...register('type')} id={id} theme={theme}>
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {/* Weapon class */}
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

        {/* Effect + Armor */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Effect (optional)" theme="light">
            {(id, _hasError, theme) => (
              <Input
                {...register('effect')}
                id={id}
                placeholder="e.g. Attack Up (S)"
                theme={theme}
              />
            )}
          </Field>
          <Field label="Armor value (optional)" theme="light">
            {(id, _hasError, theme) => (
              <Input
                {...register('armor', { valueAsNumber: true })}
                id={id}
                type="number"
                min={0}
                placeholder="0"
                theme={theme}
              />
            )}
          </Field>
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

        {/* Elemental resistances */}
        <div>
          <p className="mb-2 text-sm font-medium text-cream/80">
            Elemental resistances{' '}
            <span className="font-normal text-muted">(optional)</span>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {RESISTANCE_ELEMENTS.map((el) => (
              <div key={el} className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-xs font-medium capitalize text-cream/70">
                  <ElementIcon element={el} className="h-3.5 w-3.5" />
                  {el}
                </span>
                <Input
                  {...register(
                    `elementalResistances.${el}` as const,
                    { valueAsNumber: true },
                  )}
                  type="number"
                  placeholder="0"
                  theme="light"
                />
              </div>
            ))}
          </div>
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
          <Button type="submit" size="sm" loading={createEquipment.isPending}>
            Create equipment
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
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
