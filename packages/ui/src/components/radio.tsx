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
        'border-input checked:border-primary checked:bg-primary after:bg-background focus-visible:ring-primary/20 focus-visible:ring-3 not-disabled:shadow-xs outline-hidden hover:not-disabled:not-checked:border-ring/60 hover:not-disabled:not-checked:aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20 aria-invalid:border-destructive peer inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border transition after:size-full after:rounded-full checked:after:size-1 disabled:opacity-50',
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
