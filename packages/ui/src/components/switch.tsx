import { cn } from '@/lib/utils';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

/* -----------------------------------------------------------------------------
 * Component: Switch
 * -------------------------------------------------------------------------- */

type SwitchElement = ComponentRef<typeof SwitchPrimitives.Root>;
type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;

const Switch = forwardRef<SwitchElement, SwitchProps>(
  ({ className, ...props }, forwardedRef) => (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-sm transition',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
        'disabled:cursor-default disabled:opacity-50',
        className,
      )}
      {...props}
      ref={forwardedRef}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full shadow transition',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitives.Root>
  ),
);

Switch.displayName = SwitchPrimitives.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Switch, type SwitchProps };
