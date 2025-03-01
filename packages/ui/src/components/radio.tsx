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
        'border-input peer inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border shadow-sm transition',
        'hover:not-disabled:not-checked:border-input-hover',
        'checked:border-primary checked:bg-primary',
        'checked:after:size-1',
        'after:bg-background after:size-full after:rounded-full after:transition-[width,height]',
        'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none',
        'disabled:opacity-50',
        className,
      )}
      type="radio"
      onChange={composeEventHandlers(onChange, (event) => onValueChange?.(event.currentTarget.value))}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Radio };
