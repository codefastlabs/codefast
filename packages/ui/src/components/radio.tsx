'use client';

import type { ComponentProps, JSX } from 'react';

import { composeEventHandlers } from '@radix-ui/primitive';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Radio
 * -------------------------------------------------------------------------- */

function Radio({
  className,
  onChange,
  onValueChange,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
  onValueChange?: (value: string) => void;
}): JSX.Element {
  return (
    <input
      className={cn(
        'border-input hover:not-disabled:not-checked:border-input-hover checked:border-primary checked:bg-primary after:bg-background focus-visible:ring-ring focus-visible:ring-3 not-disabled:shadow-xs peer inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border after:size-full after:rounded-full checked:after:size-1 focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      data-slot="radio"
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
