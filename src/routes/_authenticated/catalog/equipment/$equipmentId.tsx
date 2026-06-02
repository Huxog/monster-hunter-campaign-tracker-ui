import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
} from '../../../../features/equipment/api';
import { useMaterialsAll } from '../../../../features/materials/api';
import { RecipeEditor } from '../../../../shared/components/RecipeEditor';
import {
  equipmentUpdateSchema,
  type EquipmentUpdateInput,
} from '../../../../features/equipment/schemas';
import { EQUIPMENT_TYPES, type Equipment } from '../../../../features/equipment/types';
import { WEAPON_CLASSES } from '../../../../features/weapons/types';
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
  '/_authenticated/catalog/equipment/$equipmentId',
)({
  component: EquipmentDetailPage,
});

const RESISTANCE_ELEMENTS = [
  'fire',
  'ice',
  'thunder',
  'water',
  'dragon',
] as const;
type ResistanceElement = (typeof RESISTANCE_ELEMENTS)[number];

function EquipmentDetailPage() {
  const { equipmentId } = Route.useParams();
  const { data: equip, isPending, isError } = useEquipment(equipmentId);
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteEquipment = useDeleteEquipment();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !equip) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load equipment. Please try again.
        </div>
      </div>
    );
  }

  function handleDelete() {
    deleteEquipment.mutate(equipmentId, {
      onSuccess: () => void navigate({ to: '/catalog/equipment' }),
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link
          to="/catalog/equipment"
          className="transition-colors hover:text-cream"
        >
          Equipment
        </Link>
        <span>/</span>
        <span className="text-cream">{equip.name}</span>
      </nav>

      {/* Header card */}
      <div className="mb-6 rounded-lg border border-primary/15 bg-surface p-6">
        {mode === 'edit' ? (
          <EditEquipmentForm
            equipmentId={equipmentId}
            equip={equip}
            onSuccess={() => setMode('view')}
            onCancel={() => setMode('view')}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {equip.imagePath && (
                  <img
                    src={equip.imagePath}
                    alt={equip.name}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-cream">
                      {equip.name}
                    </h1>
                    <Badge variant="muted" className="capitalize">
                      {equip.type}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                    <WeaponClassIcon weaponClass={equip.class} className="h-4 w-4" />
                    {equip.class}
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

            {/* Stats row */}
            <div className="mt-5 flex flex-wrap gap-6 text-sm">
              {equip.armor !== null && (
                <Stat label="Armor">{equip.armor}</Stat>
              )}
              {equip.effect && (
                <Stat label="Effect">{equip.effect}</Stat>
              )}
            </div>

            <ConfirmDialog
              open={confirmDelete}
              title="Delete equipment"
              description={`Delete "${equip.name}"? This cannot be undone.`}
              onConfirm={handleDelete}
              onCancel={() => setConfirmDelete(false)}
              isPending={deleteEquipment.isPending}
            />
          </>
        )}
      </div>

      {/* Elemental resistances */}
      {equip.elementalResistances && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Elemental resistances
          </h2>
          <div className="grid grid-cols-5 gap-3 rounded-lg border border-primary/15 bg-surface p-4">
            {RESISTANCE_ELEMENTS.map((el) => {
              const value = equip.elementalResistances![el];
              const abs = Math.abs(value);
              const isPositive = value > 0;
              const isNegative = value < 0;
              return (
                <div key={el} className="flex flex-col items-center gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-medium capitalize text-muted">
                    <ElementIcon element={el} className="h-3.5 w-3.5" />
                    {el}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={
                          i < abs
                            ? isPositive
                              ? 'text-sm text-primary'
                              : isNegative
                                ? 'text-sm text-ember'
                                : 'text-sm text-muted/20'
                            : 'text-sm text-muted/20'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {value !== 0 && (
                    <span className={`text-xs font-semibold ${isPositive ? 'text-primary' : 'text-ember'}`}>
                      {isPositive ? `+${value}` : value}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Craft for hunter */}
      {equip.materials !== undefined && equip.materials.length > 0 && (
        <CraftForHunterSection
          craftableType="equipment"
          craftableId={equipmentId}
          craftableClass={equip.class}
          recipe={equip.materials}
        />
      )}

      {/* Recipe */}
      {equip.materials !== undefined && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Crafting recipe
          </h2>
          {equip.materials.length === 0 ? (
            <p className="rounded-lg border border-primary/15 bg-surface px-4 py-6 text-center text-sm text-muted">
              No materials required.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equip.materials.map((m) => (
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

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="font-medium text-cream">{children}</span>
    </div>
  );
}

// ─── Edit equipment form ──────────────────────────────────────────────────────

interface EditEquipmentFormProps {
  equipmentId: string;
  equip: Equipment;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditEquipmentForm({
  equipmentId,
  equip,
  onSuccess,
  onCancel,
}: EditEquipmentFormProps) {
  const updateEquipment = useUpdateEquipment(equipmentId);
  const { data: materialsData } = useMaterialsAll();
  const materials = materialsData?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentUpdateInput>({
    resolver: zodResolver(equipmentUpdateSchema),
    defaultValues: {
      name: equip.name,
      class: equip.class,
      effect: equip.effect ?? '',
      armor: equip.armor ?? undefined,
      elementalResistances: equip.elementalResistances ?? {
        fire: 0,
        ice: 0,
        thunder: 0,
        water: 0,
        dragon: 0,
      },
      imagePath: equip.imagePath ?? '',
      materials: (equip.materials ?? []).map((m) => ({ id: m.id, quantity: m.quantity })),
    },
  });

  const serverError =
    updateEquipment.error instanceof ApiError
      ? updateEquipment.error.message
      : null;

  const onSubmit = (data: EquipmentUpdateInput) => {
    updateEquipment.mutate(data, { onSuccess });
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
          <span className="text-sm font-medium text-cream/80">
            Type
          </span>
          <span className="rounded-md border border-primary/20 bg-surface-alt px-3 py-2 text-sm text-muted capitalize">
            {equip.type} (immutable)
          </span>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Effect (optional)" theme="light">
          {(id, _hasError, theme) => (
            <Input {...register('effect')} id={id} theme={theme} />
          )}
        </Field>
        <Field label="Armor value (optional)" theme="light">
          {(id, _hasError, theme) => (
            <Input
              {...register('armor', { valueAsNumber: true })}
              id={id}
              type="number"
              min={0}
              theme={theme}
            />
          )}
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-cream/80">
          Elemental resistances
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
        <Button type="submit" size="sm" loading={updateEquipment.isPending}>
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
