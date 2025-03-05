import type { ComponentProps, JSX, ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: 'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5 [&>svg]:shrink-0',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'bg-background border-input border',
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

interface BadgeProps extends Omit<ComponentProps<'div'>, 'prefix'>, BadgeVariantsProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

function Badge({ children, className, prefix, suffix, variant, ...props }: BadgeProps): JSX.Element {
  return (
    <div className={badgeVariants({ className, variant })} {...props}>
      {prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { BadgeProps };
export { Badge };
