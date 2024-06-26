'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { type VariantProps } from 'cva';
import { cva } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Toggle
 * -------------------------------------------------------------------------- */

const toggleVariants = cva({
  base: 'hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      default: 'bg-transparent',
      outline: 'border-input hover:bg-accent hover:text-accent-foreground border bg-transparent shadow-sm',
    },
    size: {
      default: 'h-10 px-3',
      sm: 'h-9 px-2.5',
      lg: 'h-11 px-5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ToggleVariantsProps = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

type ToggleElement = React.ElementRef<typeof TogglePrimitive.Root>;
type ToggleProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & ToggleVariantsProps;

const Toggle = React.forwardRef<ToggleElement, ToggleProps>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={toggleVariants({ variant, size, className })} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle, toggleVariants, type ToggleProps, type ToggleVariantsProps };
