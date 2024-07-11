import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground border-transparent shadow',
      secondary: 'bg-secondary text-secondary-foreground border-transparent',
      destructive: 'bg-destructive text-destructive-foreground border-transparent shadow',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BadgeVariantsProps = VariantProps<typeof badgeVariants>;

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & BadgeVariantsProps;

function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge, type BadgeProps };
