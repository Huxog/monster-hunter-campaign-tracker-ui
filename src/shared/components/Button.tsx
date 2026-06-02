import { tv, type VariantProps } from 'tailwind-variants';

const button = tv({
  base: 'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
  variants: {
    variant: {
      primary: 'bg-primary text-background hover:bg-primary-light',
      secondary: 'border border-primary/20 bg-surface-alt text-cream hover:border-primary/40 hover:bg-surface',
      ghost: 'text-primary hover:bg-primary/10',
      danger: 'bg-ember text-cream hover:bg-ember/80',
    },
    size: {
      sm: 'h-8 px-3 text-sm rounded',
      md: 'h-10 px-4 text-sm rounded-md',
      lg: 'h-11 px-6 text-base rounded-md',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

type ButtonVariants = VariantProps<typeof button>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={button({ variant, size, fullWidth, className })}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
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
