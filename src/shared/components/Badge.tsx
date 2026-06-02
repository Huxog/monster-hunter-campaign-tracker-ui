import { tv, type VariantProps } from 'tailwind-variants';

const badge = tv({
  base: 'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
  variants: {
    variant: {
      default: 'bg-surface-alt text-cream',
      primary: 'bg-primary/20 text-primary',
      success: 'bg-green-900/40 text-green-300',
      danger: 'bg-ember/20 text-ember',
      muted: 'bg-surface-alt text-muted',
    },
  },
  defaultVariants: { variant: 'default' },
});

type BadgeVariants = VariantProps<typeof badge>;

export interface BadgeProps extends BadgeVariants {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return <span className={badge({ variant, className })}>{children}</span>;
}
