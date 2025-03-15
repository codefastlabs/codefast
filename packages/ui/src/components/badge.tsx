import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { Slot } from '@radix-ui/react-slot';
import { tv } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: 'focus-visible:ring-ring/20 focus-visible:ring-3 outline-hidden inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-medium transition [&>svg]:size-3 [&>svg]:shrink-0',
  variants: {
    variant: {
      default:
        'bg-primary [a&]:hover:bg-primary/80 text-primary-foreground focus-visible:ring-primary/20 border-transparent',
      secondary: 'bg-secondary [a&]:hover:bg-secondary/80 text-secondary-foreground border-transparent',
      destructive:
        'bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 border-transparent text-white',
      outline:
        'bg-background border-input [a&]:hover:bg-accent [a&]:hover:text-accent-foreground focus-visible:border-ring',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

/* -----------------------------------------------------------------------------
 * Component: Badge
 * -------------------------------------------------------------------------- */

function Badge({
  className,
  asChild,
  variant,
  ...props
}: ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }): JSX.Element {
  const Component = asChild ? Slot : 'span';

  return <Component className={badgeVariants({ className, variant })} data-slot="badge" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Badge, badgeVariants };
