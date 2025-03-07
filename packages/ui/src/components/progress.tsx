import type { ComponentProps, JSX } from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Progress
 * -------------------------------------------------------------------------- */

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root>;

function Progress({ className, value, ...props }: ProgressProps): JSX.Element {
  return (
    <ProgressPrimitive.Root
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      data-slot="progress"
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="bg-primary size-full flex-1 transition"
        data-slot="progress-indicator"
        style={{
          transform: `translateX(-${String(100 - (value ?? 0))}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ProgressProps };
export { Progress };
