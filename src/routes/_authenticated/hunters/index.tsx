import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useHunters } from '../../../features/hunters/api';
import { useCampaigns } from '../../../features/campaigns/api';
import { HunterCard } from '../../../features/hunters/components/HunterCard';
import { Pagination } from '../../../shared/components/Pagination';

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_authenticated/hunters/')({
  validateSearch: searchSchema,
  component: HuntersPage,
});

function HuntersPage() {
  const { page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: huntersData, isPending: huntersPending, isError: huntersError } = useHunters({ page });
  const { data: campaignsData } = useCampaigns();

  function setPage(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }),
      replace: true,
    });
  }

  const campaignMap = new Map(
    (campaignsData?.data ?? []).map((c) => [c.id, c.name]),
  );

  const hunters = huntersData?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream">Hunters</h1>
        <p className="mt-1 text-sm text-muted">All hunters across active campaigns.</p>
      </div>

      {huntersPending && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {huntersError && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          Failed to load hunters. Please try again.
        </div>
      )}

      {!huntersPending && hunters.length === 0 && (
        <div className="rounded-lg border border-primary/15 bg-surface px-6 py-12 text-center">
          <p className="text-muted">No hunters yet.</p>
          <p className="mt-1 text-xs text-muted">
            Go to a campaign to create your first hunter.
          </p>
        </div>
      )}

      {hunters.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {hunters.map((hunter) => (
              <HunterCard
                key={hunter.id}
                hunter={hunter}
                campaignName={campaignMap.get(hunter.campaignId)}
              />
            ))}
          </div>
          {huntersData && <Pagination meta={huntersData.meta} onPageChange={setPage} />}
        </>
      )}
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
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
