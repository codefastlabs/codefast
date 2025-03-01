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
        'p-0.75 inset-shadow-xs peer inline-flex h-5 w-8 shrink-0 items-center rounded-full ring',
        'data-[state=unchecked]:ring-input data-[state=unchecked]:bg-input data-[state=unchecked]:inset-shadow-input',
        'data-[state=checked]:ring-primary data-[state=checked]:bg-primary data-[state=checked]:inset-shadow-primary',
        'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-background pointer-events-none block size-3.5 rounded-full shadow-lg transition',
          'data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitives.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { SwitchProps };
export { Switch };
