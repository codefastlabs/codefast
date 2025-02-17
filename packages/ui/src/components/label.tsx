import type { ComponentProps, JSX } from 'react';

import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Label
 * -------------------------------------------------------------------------- */

type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;

function Label({ className, ...props }: LabelProps): JSX.Element {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm font-medium leading-none peer-disabled:pointer-events-none peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { LabelProps };
export { Label };
