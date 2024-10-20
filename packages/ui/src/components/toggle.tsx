import * as TogglePrimitive from '@radix-ui/react-toggle';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef, type ReactNode } from 'react';

import { toggleVariants, type ToggleVariantsProps } from '@/styles/toggle-variants';

/* -----------------------------------------------------------------------------
 * Component: Toggle
 * -------------------------------------------------------------------------- */

type ToggleElement = ComponentRef<typeof TogglePrimitive.Root>;
interface ToggleProps
  extends Omit<ComponentPropsWithoutRef<typeof TogglePrimitive.Root>, 'prefix'>,
    ToggleVariantsProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const Toggle = forwardRef<ToggleElement, ToggleProps>(
  ({ className, size, icon, variant, prefix, children, suffix, ...props }, forwardedRef) => (
    <TogglePrimitive.Root ref={forwardedRef} className={toggleVariants({ className, icon, size, variant })} {...props}>
      {prefix}
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
      {suffix}
    </TogglePrimitive.Root>
  ),
);

Toggle.displayName = TogglePrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toggle, type ToggleProps };
