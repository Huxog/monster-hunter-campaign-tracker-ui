import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMonster,
  useUpdateMonster,
  useDeleteMonster,
} from '../../../../features/monsters/api';
import {
  monsterUpdateSchema,
  type MonsterUpdateInput,
} from '../../../../features/monsters/schemas';
import {
  STAR_VALUES,
  ELEMENTAL_TYPES,
  AILMENT_TYPES,
  type WeaknessScale,
  type Monster,
} from '../../../../features/monsters/types';
import { useMaterialsAll } from '../../../../features/materials/api';
import { useAuthStore } from '../../../../features/auth/store';
import { Button } from '../../../../shared/components/Button';
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog';
import { Field, Input, Select } from '../../../../shared/components/Field';
import { ElementIcon } from '../../../../shared/components/ElementIcon';
import { ApiError } from '../../../../shared/lib/apiClient';

export const Route = createFileRoute(
  '/_authenticated/catalog/monsters/$monsterId',
)({
  component: MonsterDetailPage,
});

function MonsterDetailPage() {
  const { monsterId } = Route.useParams();
  const { data: monster, isPending, isError } = useMonster(monsterId);
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMonster = useDeleteMonster();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !monster) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load monster. Please try again.
        </div>
      </div>
    );
  }

  function handleDelete() {
    deleteMonster.mutate(monsterId, {
      onSuccess: () => void navigate({ to: '/catalog/monsters' }),
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link
          to="/catalog/monsters"
          className="transition-colors hover:text-cream"
        >
          Monsters
        </Link>
        <span>/</span>
        <span className="text-cream">{monster.name}</span>
      </nav>

      {/* Monster card */}
      <div className="overflow-hidden rounded-lg border-2 border-primary/25 bg-surface shadow-sm ring-1 ring-inset ring-primary/10">
        {mode === 'edit' ? (
          <div className="p-6">
            <EditMonsterForm
              monsterId={monsterId}
              monster={monster}
              onSuccess={() => setMode('view')}
              onCancel={() => setMode('view')}
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6">
              <div className="flex items-start gap-5">
                {monster.imagePath ? (
                  <img
                    src={monster.imagePath}
                    alt={monster.name}
                    className="h-20 w-20 shrink-0 rounded-lg border border-primary/20 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-surface-alt text-3xl">
                    🐉
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-cream">
                        {monster.name}
                      </h1>
                      <div className="mt-1 flex items-center gap-0.5">
                        {Array.from({ length: monster.stars }, (_, i) => (
                          <span key={i} className="text-sm text-ember">★</span>
                        ))}
                        {Array.from({ length: 7 - monster.stars }, (_, i) => (
                          <span key={i} className="text-sm text-muted/30">★</span>
                        ))}
                      </div>
                      {monster.description && (
                        <p className="mt-2 text-sm text-muted">
                          {monster.description}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex shrink-0 items-center gap-2">
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
                </div>
              </div>
            </div>

            {/* Weaknesses — two columns separated by a gold divider */}
            <div className="border-t border-primary/20">
              <div className="grid grid-cols-1 divide-y divide-primary/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-5">
                  <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                    Elemental
                  </h2>
                  <div className="rounded border border-primary/15 bg-surface-alt/60 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {ELEMENTAL_TYPES.map((el) => (
                        <WeaknessCell
                          key={el}
                          label={el}
                          value={monster.elementalWeaknesses[el]}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                    Ailments
                  </h2>
                  <div className="rounded border border-primary/15 bg-surface-alt/60 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {AILMENT_TYPES.map((ail) => (
                        <WeaknessCell
                          key={ail}
                          label={ail}
                          value={monster.ailmentWeaknesses[ail]}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Material drops */}
            {monster.materials !== undefined && (
              <div className="border-t border-primary/20 p-5">
                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Drops
                </h2>
                {monster.materials.length === 0 ? (
                  <p className="text-sm text-muted">No materials listed.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {monster.materials.map((m) => (
                      <Link
                        key={m.id}
                        to="/catalog/materials/$materialId"
                        params={{ materialId: m.id }}
                        className="rounded-full border border-primary/20 bg-surface-alt px-3 py-1 text-sm text-cream transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        {m.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <ConfirmDialog
              open={confirmDelete}
              title="Delete monster"
              description={`Delete "${monster.name}"? This cannot be undone.`}
              onConfirm={handleDelete}
              onCancel={() => setConfirmDelete(false)}
              isPending={deleteMonster.isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Weakness cell ────────────────────────────────────────────────────────────

interface WeaknessCellProps {
  label: string;
  value: WeaknessScale;
}

function WeaknessCell({ label, value }: WeaknessCellProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded border border-primary/10 bg-surface/70 py-2">
      <ElementIcon element={label} className="h-6 w-6" />
      <div className="flex gap-0.5">
        {([1, 2, 3] as const).map((level) => (
          <span
            key={level}
            className={level <= value ? 'text-base text-ember' : 'text-base text-muted/30'}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Edit monster form ────────────────────────────────────────────────────────

interface EditMonsterFormProps {
  monsterId: string;
  monster: Monster;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditMonsterForm({
  monsterId,
  monster,
  onSuccess,
  onCancel,
}: EditMonsterFormProps) {
  const updateMonster = useUpdateMonster(monsterId);
  const { data: materialsData } = useMaterialsAll();
  const materials = materialsData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MonsterUpdateInput>({
    resolver: zodResolver(monsterUpdateSchema),
    defaultValues: {
      name: monster.name,
      description: monster.description ?? '',
      stars: monster.stars,
      imagePath: monster.imagePath ?? '',
      elementalWeaknesses: { ...monster.elementalWeaknesses },
      ailmentWeaknesses: { ...monster.ailmentWeaknesses },
      materials: monster.materials?.map((m) => m.id) ?? [],
    },
  });

  const serverError =
    updateMonster.error instanceof ApiError
      ? updateMonster.error.message
      : null;

  const onSubmit = (data: MonsterUpdateInput) => {
    updateMonster.mutate(data, { onSuccess });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
        <Field label="Stars (1–7)" error={errors.stars?.message} theme="light">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description (optional)" theme="light">
          {(id, _hasError, theme) => (
            <Input {...register('description')} id={id} theme={theme} />
          )}
        </Field>
        <Field label="Image URL (optional)" theme="light">
          {(id, _hasError, theme) => (
            <Input {...register('imagePath')} id={id} theme={theme} />
          )}
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-cream/80">
          Elemental weaknesses{' '}
          <span className="font-normal text-muted">(0 = none, 3 = extreme)</span>
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

      <div>
        <p className="mb-2 text-sm font-medium text-cream/80">
          Ailment weaknesses{' '}
          <span className="font-normal text-muted">(0 = none, 3 = extreme)</span>
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

      {materials.length > 0 && (
        <EditMaterialsMultiSelect control={control} materials={materials} />
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
        <Button type="submit" size="sm" loading={updateMonster.isPending}>
          Save changes
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface EditMaterialsMultiSelectProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  materials: { id: string; name: string }[];
}

function EditMaterialsMultiSelect({
  control,
  materials,
}: EditMaterialsMultiSelectProps) {
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
