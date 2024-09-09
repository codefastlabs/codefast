'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Toggle
 * -------------------------------------------------------------------------- */

const toggleVariants = tv({
  base: [
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition',
    'hover:bg-accent/80 hover:text-accent-foreground/80',
    'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      default: '',
      outline: 'border-input border',
    },
    size: {
      xxs: 'h-7 px-2',
      xs: 'h-8 px-2',
      sm: 'h-9 px-3',
      md: 'h-10 px-3',
      lg: 'h-11 px-4',
      xl: 'h-12 px-4',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

type ToggleVariantsProps = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

type ToggleElement = React.ElementRef<typeof TogglePrimitive.Root>;
type ToggleProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & ToggleVariantsProps;

const Toggle = React.forwardRef<ToggleElement, ToggleProps>(({ className, variant, size, ...props }, forwardedRef) => (
  <TogglePrimitive.Root ref={forwardedRef} className={toggleVariants({ variant, size, className })} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle, toggleVariants, type ToggleProps, type ToggleVariantsProps };
