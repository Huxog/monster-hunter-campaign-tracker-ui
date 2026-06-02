import { Link } from '@tanstack/react-router';
import type { Campaign } from '../types';

export interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const hunterCount = campaign.hunters?.length ?? 0;
  const startDate = new Date(campaign.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      to="/campaigns/$campaignId"
      params={{ campaignId: campaign.id }}
      className="group block rounded-lg border border-primary/15 bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-surface-alt"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-cream group-hover:text-primary transition-colors">
            {campaign.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted">{campaign.teamName}</p>
        </div>
        {campaign.map && (
          <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {campaign.map.name}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span>
          {hunterCount} {hunterCount === 1 ? 'hunter' : 'hunters'}
        </span>
        <span>·</span>
        <span>Started {startDate}</span>
      </div>
    </Link>
  );
}
