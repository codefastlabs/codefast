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
        'shadow-xs p-0.75 peer inline-flex h-5 w-8 shrink-0 items-center rounded-full transition',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-background pointer-events-none block size-3.5 rounded-full border border-transparent shadow-sm transition',
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
