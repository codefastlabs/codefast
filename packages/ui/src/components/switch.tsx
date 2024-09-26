import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Switch
 * -------------------------------------------------------------------------- */

type SwitchElement = React.ElementRef<typeof SwitchPrimitives.Root>;
type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;

const Switch = React.forwardRef<SwitchElement, SwitchProps>(({ className, ...props }, forwardedRef) => (
  <SwitchPrimitives.Root
    className={cn(
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50',
      className,
    )}
    {...props}
    ref={forwardedRef}
  >
    <SwitchPrimitives.Thumb className="bg-background pointer-events-none block size-4 rounded-full transition data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitives.Root>
));

Switch.displayName = SwitchPrimitives.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Switch, type SwitchProps };
