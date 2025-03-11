import type { ComponentProps, JSX, ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as TogglePrimitive from '@radix-ui/react-toggle';
import { tv } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Toggle
 * -------------------------------------------------------------------------- */

const toggleVariants = tv({
  base: "focus-visible:ring-ring focus-visible:ring-3 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground outline-hidden inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  variants: {
    size: {
      sm: 'h-8 min-w-8 px-1.5', // 32px
      md: 'h-9 min-w-9 px-2', // 36px
      lg: 'h-10 min-w-10 px-2.5', // 40px
    },
    variant: {
      default: 'bg-transparent',
      outline:
        'border-input not-disabled:shadow-xs hover:not-disabled:bg-secondary hover:not-disabled:text-secondary-foreground border',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

function Toggle({
  children,
  className,
  prefix,
  size,
  suffix,
  variant,
  ...props
}: Omit<ComponentProps<typeof TogglePrimitive.Root>, 'prefix'> &
  VariantProps<typeof toggleVariants> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  }): JSX.Element {
  return (
    <TogglePrimitive.Root className={toggleVariants({ className, size, variant })} data-slot="toggle" {...props}>
      {prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </TogglePrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle, toggleVariants };
