'use client';

import type { ComponentProps, JSX } from 'react';

import { composeEventHandlers } from '@radix-ui/primitive';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Radio
 * -------------------------------------------------------------------------- */

interface RadioProps extends Omit<ComponentProps<'input'>, 'type'> {
  onValueChange?: (value: string) => void;
}

function Radio({ className, onChange, onValueChange, ...props }: RadioProps): JSX.Element {
  return (
    <input
      className={cn(
        'peer appearance-none',
        'border-input shadow-xs inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition',
        'hover:border-primary',
        'checked:border-primary checked:bg-primary',
        'after:bg-background after:size-full after:rounded-full after:transition-[width,height]',
        'checked:after:size-1',
        'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      type="radio"
      onChange={composeEventHandlers(onChange, (event) =>
        onValueChange?.(event.currentTarget.value),
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Radio };
