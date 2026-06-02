import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  materialsQueryOptions,
  materialsAllQueryOptions,
  useCreateMaterial,
} from '../../../../features/materials/api';
import {
  materialCreateSchema,
  type MaterialCreateInput,
} from '../../../../features/materials/schemas';
import { useAuthStore } from '../../../../features/auth/store';
import { Button } from '../../../../shared/components/Button';
import { Field, Input } from '../../../../shared/components/Field';
import { SearchBar } from '../../../../shared/components/SearchBar';
import { Pagination } from '../../../../shared/components/Pagination';
import { ApiError } from '../../../../shared/lib/apiClient';

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/catalog/materials/')({
  validateSearch: searchSchema,
  component: MaterialsPage,
});

function MaterialsPage() {
  const { page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isPending, isError } = useQuery(
    search ? materialsAllQueryOptions() : materialsQueryOptions({ page }),
  );

  function setPage(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }),
      replace: true,
    });
  }

  const pageItems = data?.data ?? [];
  const filtered = pageItems.filter(
    (m) => !search || m.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cream">Materials</h1>
          <p className="mt-1 text-sm text-muted">
            Crafting ingredients dropped by monsters.
          </p>
        </div>
        {isAdmin && !showCreateForm && (
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            + New material
          </Button>
        )}
      </div>

      {isAdmin && showCreateForm && (
        <div className="mb-6">
          <CreateMaterialForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {isPending && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load materials. Please try again.
        </div>
      )}

      {/* Search */}
      {!isPending && !isError && (
        <div className="mb-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search materials…" />
        </div>
      )}

      {data && pageItems.length === 0 && !showCreateForm && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No materials yet.</p>
        </div>
      )}

      {data && pageItems.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No materials match your search.</p>
        </div>
      )}

      {data && filtered.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((material) => (
            <Link
              key={material.id}
              to="/catalog/materials/$materialId"
              params={{ materialId: material.id }}
              className="group flex items-center justify-between rounded-lg border border-primary/15 bg-surface px-4 py-3 transition-colors hover:border-primary/40 hover:bg-surface-alt"
            >
              <span className="font-medium text-cream transition-colors group-hover:text-primary">
                {material.name}
              </span>
              <span className="text-xs text-muted">→</span>
            </Link>
          ))}
        </div>
      )}

      {!search && data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}

// ─── Create material form ─────────────────────────────────────────────────────

interface CreateMaterialFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateMaterialForm({ onSuccess, onCancel }: CreateMaterialFormProps) {
  const createMaterial = useCreateMaterial();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialCreateInput>({
    resolver: zodResolver(materialCreateSchema),
  });

  const serverError =
    createMaterial.error instanceof ApiError
      ? createMaterial.error.message
      : null;

  const onSubmit = (data: MaterialCreateInput) => {
    createMaterial.mutate(data, { onSuccess });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-surface p-5">
      <h3 className="mb-4 font-semibold text-cream">New material</h3>
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
              placeholder="e.g. Rathalos Scale"
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

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" size="sm" loading={createMaterial.isPending}>
            Create material
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
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
