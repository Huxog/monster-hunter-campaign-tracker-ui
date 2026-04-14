import { tv, type VariantProps } from 'tailwind-variants';
import { useId } from 'react';

// ─── Input ────────────────────────────────────────────────────────────────────

const input = tv({
  base: 'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition',
  variants: {
    theme: {
      dark: 'bg-surface-alt text-cream placeholder:text-muted',
      light: 'bg-white text-gray-900 placeholder:text-gray-400',
    },
    hasError: {
      true: 'border-ember focus:ring-ember/40',
      false: '',
    },
  },
  compoundVariants: [
    {
      theme: 'dark',
      hasError: false,
      class: 'border-gold/20 focus:ring-gold/40 focus:border-gold/50',
    },
    {
      theme: 'light',
      hasError: false,
      class: 'border-gray-200 focus:ring-gray-300 focus:border-gray-400',
    },
    {
      theme: 'light',
      hasError: true,
      class: 'border-red-400 focus:ring-red-200',
    },
  ],
  defaultVariants: {
    theme: 'dark',
    hasError: false,
  },
});

type InputVariants = VariantProps<typeof input>;

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    InputVariants {}

export function Input({ hasError, theme, className, ...props }: InputProps) {
  return <input className={input({ hasError, theme, className })} {...props} />;
}

// ─── Field (label + input + error) ────────────────────────────────────────────

const fieldLabel = tv({
  base: 'text-sm font-medium',
  variants: {
    theme: {
      dark: 'text-cream/80',
      light: 'text-gray-700',
    },
  },
  defaultVariants: { theme: 'dark' },
});

const fieldError = tv({
  base: 'text-xs',
  variants: {
    theme: {
      dark: 'text-ember',
      light: 'text-red-600',
    },
  },
  defaultVariants: { theme: 'dark' },
});

export type FieldTheme = 'dark' | 'light';

export interface FieldProps {
  label: string;
  error?: string;
  theme?: FieldTheme;
  children: (id: string, hasError: boolean, theme: FieldTheme) => React.ReactNode;
}

export function Field({ label, error, theme = 'dark', children }: FieldProps) {
  const id = useId();
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={fieldLabel({ theme })}>
        {label}
      </label>
      {children(id, hasError, theme)}
      {hasError && <p className={fieldError({ theme })}>{error}</p>}
    </div>
  );
}
