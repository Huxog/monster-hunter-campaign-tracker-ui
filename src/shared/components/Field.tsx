import { tv, type VariantProps } from 'tailwind-variants';
import { useId } from 'react';

// ─── Input ────────────────────────────────────────────────────────────────────

const input = tv({
  base: 'w-full rounded-md border bg-surface-alt px-3 py-2 text-cream text-sm placeholder:text-muted focus:outline-none focus:ring-2 transition',
  variants: {
    hasError: {
      true: 'border-ember focus:ring-ember/40',
      false: 'border-gold/20 focus:ring-gold/40 focus:border-gold/50',
    },
  },
  defaultVariants: {
    hasError: false,
  },
});

type InputVariants = VariantProps<typeof input>;

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    InputVariants {}

export function Input({ hasError, className, ...props }: InputProps) {
  return <input className={input({ hasError, className })} {...props} />;
}

// ─── Field (label + input + error) ────────────────────────────────────────────

export interface FieldProps {
  label: string;
  error?: string;
  children: (id: string, hasError: boolean) => React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  const id = useId();
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-cream/80">
        {label}
      </label>
      {children(id, hasError)}
      {hasError && <p className="text-xs text-ember">{error}</p>}
    </div>
  );
}
