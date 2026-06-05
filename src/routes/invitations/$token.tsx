import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useInvitationPreview,
  useAcceptInvitation,
} from '../../features/invitations/api';
import {
  acceptInvitationSchema,
  type AcceptInvitationInput,
} from '../../features/invitations/schemas';
import { WEAPON_CLASSES } from '../../features/weapons/types';
import { useAuthStore } from '../../features/auth/store';
import { Button } from '../../shared/components/Button';
import { Field, Input, Select } from '../../shared/components/Field';
import { ApiError } from '../../shared/lib/apiClient';

export const Route = createFileRoute('/invitations/$token')({
  component: InvitationPage,
});

function InvitationPage() {
  const { token } = Route.useParams();
  const { data, isPending, isError, error } = useInvitationPreview(token);
  const { token: authToken } = useAuthStore();
  const isAuthed = Boolean(authToken);
  const navigate = useNavigate();

  const invitation = data?.data;

  const redirectPath = `/invitations/${token}`;

  if (isPending) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </Shell>
    );
  }

  if (isError || !invitation) {
    const apiErr = error instanceof ApiError ? error : null;
    const code = (apiErr?.body as { code?: string } | undefined)?.code;
    let message = 'This invitation link is invalid.';
    if (code === 'INV-0306-0003') message = 'This invitation has expired.';
    if (code === 'INV-0306-0004') message = 'This invitation has already been accepted.';
    if (apiErr?.status === 404) message = 'This invitation link does not exist.';

    return (
      <Shell>
        <div className="mx-auto max-w-sm text-center">
          <p className="text-4xl font-black text-ember">!</p>
          <h1 className="mt-3 text-xl font-bold text-cream">Invalid Invitation</h1>
          <p className="mt-2 text-sm text-muted">{message}</p>
          <Link
            to="/login"
            className="mt-8 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-primary-light"
          >
            Go to login
          </Link>
        </div>
      </Shell>
    );
  }

  const expiresAt = new Date(invitation.expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        {/* Invite card */}
        <div className="overflow-hidden rounded-lg border-2 border-primary/25 bg-surface shadow-sm ring-1 ring-inset ring-primary/10">
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              You&apos;ve been invited
            </p>
            <h1 className="mt-2 text-2xl font-bold text-cream">
              {invitation.campaign.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Invited by <span className="font-medium text-cream">{invitation.invitedBy.name}</span>
            </p>
            <p className="mt-3 text-xs text-muted">Expires {expiresAt}</p>
          </div>

          <div className="border-t border-primary/20 p-6">
            {!isAuthed ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  Log in or create an account to join this campaign.
                </p>
                <Link
                  to="/login"
                  search={{ redirect: redirectPath }}
                  className="block w-full rounded-md bg-primary py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-primary-light"
                >
                  Log in to accept
                </Link>
                <Link
                  to="/register"
                  search={{ redirect: redirectPath }}
                  className="block w-full rounded-md border border-primary/20 py-2.5 text-center text-sm font-semibold text-cream transition-colors hover:border-primary/40"
                >
                  Create an account
                </Link>
              </div>
            ) : (
              <AcceptForm
                token={token}
                campaignId={invitation.campaignId}
                onSuccess={(campaignId) =>
                  void navigate({
                    to: '/campaigns/$campaignId',
                    params: { campaignId },
                  })
                }
              />
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ─── Accept form ──────────────────────────────────────────────────────────────

interface AcceptFormProps {
  token: string;
  campaignId: string;
  onSuccess: (campaignId: string) => void;
}

function AcceptForm({ token, campaignId, onSuccess }: AcceptFormProps) {
  const accept = useAcceptInvitation(token);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  const serverError =
    accept.error instanceof ApiError ? accept.error.message : null;

  const errorCode =
    accept.error instanceof ApiError
      ? (accept.error.body as { code?: string } | undefined)?.code
      : null;

  const errorMessage = (() => {
    if (!serverError) return null;
    if (errorCode === 'INV-0306-0001') return 'This invitation was sent to a different email address.';
    if (errorCode === 'INV-0306-0003') return 'This invitation has expired.';
    if (errorCode === 'INV-0306-0004') return 'This invitation has already been accepted.';
    if (errorCode === 'INV-0306-0005') return 'You already have a hunter in this campaign.';
    if (errorCode === 'HUN-0306-0003') return 'This campaign is full (4 hunters max).';
    return serverError;
  })();

  const onSubmit = (data: AcceptInvitationInput) => {
    accept.mutate(data, { onSuccess: () => onSuccess(campaignId) });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <p className="text-sm font-medium text-cream">Create your hunter</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={errors.playerName?.message}>
          {(id, hasError, theme) => (
            <Input
              {...register('playerName')}
              id={id}
              placeholder="Real name"
              hasError={hasError}
              theme={theme}
            />
          )}
        </Field>
        <Field label="Hunter name" error={errors.hunterName?.message}>
          {(id, hasError, theme) => (
            <Input
              {...register('hunterName')}
              id={id}
              placeholder="In-game name"
              hasError={hasError}
              theme={theme}
            />
          )}
        </Field>
      </div>

      <Field label="Weapon class" error={errors.class?.message}>
        {(id, hasError, theme) => (
          <Select {...register('class')} id={id} hasError={hasError} theme={theme}>
            <option value="">— Choose a weapon —</option>
            {WEAPON_CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        )}
      </Field>

      {errorMessage && (
        <p role="alert" className="rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
          {errorMessage}
        </p>
      )}

      <Button type="submit" fullWidth loading={accept.isPending}>
        Join campaign
      </Button>
    </form>
  );
}

// ─── Shell layout ─────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      {children}
    </div>
  );
}
