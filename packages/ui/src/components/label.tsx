'use client';

import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/tailwind-variants';
import * as LabelPrimitive from '@radix-ui/react-label';

/* -----------------------------------------------------------------------------
 * Component: Label
 * -------------------------------------------------------------------------- */

type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;

function Label({ className, ...props }: LabelProps): JSX.Element {
  return (
    <LabelPrimitive.Root
      className={cn(
        'data-invalid:text-destructive peer-aria-invalid:text-destructive inline-block text-sm leading-none font-medium group-data-disabled:opacity-50 peer-disabled:opacity-50 peer-data-disabled:opacity-50',
        className,
      )}
      data-slot="label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Label };
export type { LabelProps };
