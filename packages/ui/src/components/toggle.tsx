'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { toggleVariants, type ToggleVariantsProps } from '@/styles/toggle-variants';

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

export { Toggle, type ToggleProps };
