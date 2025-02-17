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
        'shadow-xs peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
        'disabled:cursor-default disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full shadow-sm transition',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
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
