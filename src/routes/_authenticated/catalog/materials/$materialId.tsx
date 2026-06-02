import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from '../../../../features/materials/api';
import {
  materialUpdateSchema,
  type MaterialUpdateInput,
} from '../../../../features/materials/schemas';
import { useAuthStore } from '../../../../features/auth/store';
import { Button } from '../../../../shared/components/Button';
import { ConfirmDialog } from '../../../../shared/components/ConfirmDialog';
import { Field, Input } from '../../../../shared/components/Field';
import { ApiError } from '../../../../shared/lib/apiClient';

export const Route = createFileRoute(
  '/_authenticated/catalog/materials/$materialId',
)({
  component: MaterialDetailPage,
});

function MaterialDetailPage() {
  const { materialId } = Route.useParams();
  const { data: material, isPending, isError } = useMaterial(materialId);
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMaterial = useDeleteMaterial();
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !material) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load material. Please try again.
        </div>
      </div>
    );
  }

  function handleDelete() {
    deleteMaterial.mutate(materialId, {
      onSuccess: () => void navigate({ to: '/catalog/materials' }),
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link
          to="/catalog/materials"
          className="transition-colors hover:text-cream"
        >
          Materials
        </Link>
        <span>/</span>
        <span className="text-cream">{material.name}</span>
      </nav>

      {/* Header card */}
      <div className="mb-6 rounded-lg border border-primary/15 bg-surface p-6">
        {mode === 'edit' ? (
          <EditMaterialForm
            materialId={materialId}
            defaultValues={{ name: material.name }}
            onSuccess={() => setMode('view')}
            onCancel={() => setMode('view')}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-cream">
                {material.name}
              </h1>
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
              title="Delete material"
              description={`Delete "${material.name}"? This cannot be undone.`}
              onConfirm={handleDelete}
              onCancel={() => setConfirmDelete(false)}
              isPending={deleteMaterial.isPending}
            />
          </>
        )}
      </div>

      {/* Dropped by */}
      {material.monsters && material.monsters.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Dropped by
          </h2>
          <div className="flex flex-wrap gap-2">
            {material.monsters.map((monster) => (
              <Link
                key={monster.id}
                to="/catalog/monsters/$monsterId"
                params={{ monsterId: monster.id }}
                className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-surface px-3 py-1 text-sm text-cream transition-colors hover:border-primary/50 hover:text-primary"
              >
                <span>{'★'.repeat(monster.stars)}</span>
                <span>{monster.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Used in weapons */}
      {material.weapons && material.weapons.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Used in weapons
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {material.weapons.map((weapon) => (
              <Link
                key={weapon.id}
                to="/catalog/weapons/$weaponId"
                params={{ weaponId: weapon.id }}
                className="flex items-center justify-between rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40"
              >
                <span className="font-medium text-cream">{weapon.name}</span>
                <span className="text-xs text-muted">{weapon.class}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Used in equipment */}
      {material.equipment && material.equipment.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Used in equipment
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {material.equipment.map((equip) => (
              <Link
                key={equip.id}
                to="/catalog/equipment/$equipmentId"
                params={{ equipmentId: equip.id }}
                className="flex items-center justify-between rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40"
              >
                <span className="font-medium text-cream">{equip.name}</span>
                <span className="text-xs text-muted capitalize">{equip.type}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

interface EditMaterialFormProps {
  materialId: string;
  defaultValues: MaterialUpdateInput;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditMaterialForm({
  materialId,
  defaultValues,
  onSuccess,
  onCancel,
}: EditMaterialFormProps) {
  const updateMaterial = useUpdateMaterial(materialId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialUpdateInput>({
    resolver: zodResolver(materialUpdateSchema),
    defaultValues,
  });

  const serverError =
    updateMaterial.error instanceof ApiError
      ? updateMaterial.error.message
      : null;

  const onSubmit = (data: MaterialUpdateInput) => {
    updateMaterial.mutate(data, { onSuccess });
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

      {serverError && (
        <p
          role="alert"
          className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember"
        >
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={updateMaterial.isPending}>
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
