import { createPortal } from 'react-dom';
import { tv } from 'tailwind-variants';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

const overlay = tv({
  base: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
});

const dialog = tv({
  base: 'w-full max-w-sm rounded-lg border border-gold/20 bg-surface-alt p-6 shadow-xl',
});

const confirmBtn = tv({
  base: 'rounded px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ember/50',
  variants: {
    pending: {
      true: 'cursor-not-allowed opacity-50 bg-ember',
      false: 'bg-ember hover:bg-ember/80 text-cream',
    },
  },
  defaultVariants: { pending: false },
});

const cancelBtn = tv({
  base: 'rounded border border-gold/30 px-4 py-2 text-sm font-semibold text-cream transition-colors hover:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/30',
});

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div className={overlay()} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={dialog()}>
        <h2 id="confirm-title" className="mb-2 text-base font-semibold text-cream">
          {title}
        </h2>
        <p className="mb-6 text-sm text-muted">{description}</p>
        <div className="flex justify-end gap-3">
          <button className={cancelBtn()} onClick={onCancel} disabled={isPending}>
            Cancel
          </button>
          <button className={confirmBtn({ pending: isPending })} onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
