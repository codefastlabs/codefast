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
        'border-input shadow-xs outline-hidden hover:not-disabled:not-checked:border-ring/60 hover:not-disabled:not-checked:aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive checked:border-primary checked:bg-primary peer inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border disabled:opacity-50',
        'after:bg-background focus-visible:ring-3 focus-visible:checked:ring-primary/20 focus-visible:ring-ring/50 focus-visible:not-checked:border-ring after:size-full after:rounded-full after:transition-[width,height] checked:after:size-1',
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
