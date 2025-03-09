import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { Slot } from '@radix-ui/react-slot';
import { tv } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

const badgeVariants = tv({
  base: 'focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-3 inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-medium transition-[color,box-shadow,border-color,background-color] [&>svg]:size-3 [&>svg]:shrink-0',
  variants: {
    variant: {
      default: 'bg-primary [a&]:hover:bg-primary-hover text-primary-foreground border-transparent',
      secondary: 'bg-secondary [a&]:hover:bg-secondary-hover text-secondary-foreground border-transparent',
      destructive: 'bg-destructive [a&]:hover:bg-destructive-hover text-destructive-foreground border-transparent',
      outline: 'bg-background border-input [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
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
