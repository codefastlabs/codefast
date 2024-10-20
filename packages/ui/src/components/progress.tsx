import * as ProgressPrimitive from '@radix-ui/react-progress';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Progress
 * -------------------------------------------------------------------------- */

type ProgressElement = ComponentRef<typeof ProgressPrimitive.Root>;
type ProgressProps = ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>;

const Progress = forwardRef<ProgressElement, ProgressProps>(({ className, value, ...props }, forwardedRef) => (
  <ProgressPrimitive.Root
    ref={forwardedRef}
    className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="bg-primary size-full flex-1 transition"
      style={{
        transform: `translateX(-${String(100 - (value ?? 0))}%)`,
      }}
    />
  </ProgressPrimitive.Root>
));

Progress.displayName = ProgressPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Progress, type ProgressProps };
