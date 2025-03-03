import type { ComponentProps, JSX } from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Switch
 * -------------------------------------------------------------------------- */

type SwitchProps = ComponentProps<typeof SwitchPrimitives.Root>;

function Switch({ className, ...props }: SwitchProps): JSX.Element {
  return (
    <SwitchPrimitives.Root
      className={cn(
        'p-0.75 data-[state=unchecked]:bg-input data-[state=checked]:bg-primary focus-visible:ring-ring focus-visible:ring-3 peer inline-flex h-5 w-9 shrink-0 items-center overflow-hidden rounded-full focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb className="bg-background pointer-events-none block size-3.5 rounded-full shadow-sm transition data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { SwitchProps };
export { Switch };
