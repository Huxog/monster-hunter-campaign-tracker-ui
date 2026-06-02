import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useWeapon,
  useUpdateWeapon,
  useDeleteWeapon,
} from '../../../../features/weapons/api';
import { useMaterialsAll } from '../../../../features/materials/api';
import { RecipeEditor } from '../../../../shared/components/RecipeEditor';
import {
  weaponUpdateSchema,
  type WeaponUpdateInput,
} from '../../../../features/weapons/schemas';
import {
  WEAPON_CLASSES,
  ELEMENTAL_TYPES,
  type Weapon,
} from '../../../../features/weapons/types';
import { useAuthStore } from '../../../../features/auth/store';
import { Button } from '../../../../shared/components/Button';
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog';
import { Badge } from '../../../../shared/components/Badge';
import { Field, Input, Select } from '../../../../shared/components/Field';
import { ElementIcon } from '../../../../shared/components/ElementIcon';
import { WeaponClassIcon } from '../../../../shared/components/WeaponClassIcon';
import { ApiError } from '../../../../shared/lib/apiClient';
import { CraftForHunterSection } from '../../../../features/hunters/components/CraftForHunterSection';

export const Route = createFileRoute(
  '/_authenticated/catalog/weapons/$weaponId',
)({
  component: WeaponDetailPage,
});

const DAMAGE_LABELS = ['1 dmg', '2 dmg', '3 dmg', '4 dmg'] as const;

function WeaponDetailPage() {
  const { weaponId } = Route.useParams();
  const { data: weapon, isPending, isError } = useWeapon(weaponId);
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteWeapon = useDeleteWeapon();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !weapon) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load weapon. Please try again.
        </div>
      </div>
    );
  }

  function handleDelete() {
    deleteWeapon.mutate(weaponId, {
      onSuccess: () => void navigate({ to: '/catalog/weapons' }),
    });
  }

  const totalCards = weapon.damage.reduce((sum, n) => sum + n, 0);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link
          to="/catalog/weapons"
          className="transition-colors hover:text-cream"
        >
          Weapons
        </Link>
        <span>/</span>
        <span className="text-cream">{weapon.name}</span>
      </nav>

      {/* Header card */}
      <div className="mb-6 rounded-lg border border-primary/15 bg-surface p-6">
        {mode === 'edit' ? (
          <EditWeaponForm
            weaponId={weaponId}
            weapon={weapon}
            onSuccess={() => setMode('view')}
            onCancel={() => setMode('view')}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {weapon.imagePath && (
                  <img
                    src={weapon.imagePath}
                    alt={weapon.name}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-cream">
                      {weapon.name}
                    </h1>
                    {weapon.element !== 'None' && (
                      <Badge variant="primary">
                        <span className="flex items-center gap-1">
                          <ElementIcon element={weapon.element} className="h-3.5 w-3.5" />
                          {weapon.element}
                        </span>
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                    <WeaponClassIcon weaponClass={weapon.class} className="h-4 w-4" />
                    {weapon.class}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setMode('edit')}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <ConfirmDialog
              open={confirmDelete}
              title="Delete weapon"
              description={`Delete "${weapon.name}"? This cannot be undone.`}
              onConfirm={handleDelete}
              onCancel={() => setConfirmDelete(false)}
              isPending={deleteWeapon.isPending}
            />
          </>
        )}
      </div>

      {/* Damage deck */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Damage deck{' '}
          <span className="text-xs font-normal normal-case text-muted/60">
            ({totalCards} cards total)
          </span>
        </h2>
        <div className="grid grid-cols-4 gap-3 rounded-lg border border-primary/15 bg-surface p-4">
          {DAMAGE_LABELS.map((label, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-md border border-primary/10 bg-surface px-3 py-4"
            >
              <span className="text-2xl font-bold text-cream">
                {weapon.damage[i] ?? 0}
              </span>
              <span className="text-xs text-muted">{label} cards</span>
            </div>
          ))}
        </div>
      </section>

      {/* Craft for hunter */}
      {weapon.materials !== undefined && weapon.materials.length > 0 && (
        <CraftForHunterSection
          craftableType="weapon"
          craftableId={weaponId}
          craftableClass={weapon.class}
          recipe={weapon.materials}
        />
      )}

      {/* Recipe */}
      {weapon.materials !== undefined && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Crafting recipe
          </h2>
          {weapon.materials.length === 0 ? (
            <p className="rounded-lg border border-primary/15 bg-surface px-4 py-6 text-center text-sm text-muted">
              No materials required.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weapon.materials.map((m) => (
                <Link
                  key={m.id}
                  to="/catalog/materials/$materialId"
                  params={{ materialId: m.id }}
                  className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-surface px-3 py-1 text-sm text-cream transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <span className="font-medium text-primary">{m.quantity}×</span>
                  {m.name}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Edit weapon form ─────────────────────────────────────────────────────────

interface EditWeaponFormProps {
  weaponId: string;
  weapon: Weapon;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditWeaponForm({
  weaponId,
  weapon,
  onSuccess,
  onCancel,
}: EditWeaponFormProps) {
  const updateWeapon = useUpdateWeapon(weaponId);
  const { data: materialsData } = useMaterialsAll();
  const materials = materialsData?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WeaponUpdateInput>({
    resolver: zodResolver(weaponUpdateSchema),
    defaultValues: {
      name: weapon.name,
      class: weapon.class,
      element: weapon.element,
      damage: [...weapon.damage] as [number, number, number, number],
      imagePath: weapon.imagePath ?? '',
      materials: (weapon.materials ?? []).map((m) => ({ id: m.id, quantity: m.quantity })),
    },
  });

  const serverError =
    updateWeapon.error instanceof ApiError
      ? updateWeapon.error.message
      : null;

  const onSubmit = (data: WeaponUpdateInput) => {
    updateWeapon.mutate(data, { onSuccess });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <Field label="Name" error={errors.name?.message} theme="light">
        {(id, hasError, theme) => (
          <Input
            {...register('name')}
            id={id}
            hasError={hasError}
            theme={theme}
          />
        )}
      </Field>

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

      <div>
        <p className="mb-2 text-sm font-medium text-cream/80">
          Damage deck{' '}
          <span className="font-normal text-muted">
            (cards at each damage value)
          </span>
        </p>
        <div className="grid grid-cols-4 gap-3">
          {DAMAGE_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cream/70">{label}</span>
              <Input
                {...register(`damage.${i as 0 | 1 | 2 | 3}`, {
                  valueAsNumber: true,
                })}
                type="number"
                min={0}
                theme="light"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Crafting recipe */}
      <div>
        <p className="mb-2 text-sm font-medium text-cream/80">Crafting recipe</p>
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

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={updateWeapon.isPending}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
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
