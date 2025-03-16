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
        'border-input shadow-xs outline-hidden peer inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border',
        'hover:not-disabled:not-checked:border-ring/60',
        'checked:border-primary checked:bg-primary checked:shadow-primary/50',
        'focus-visible:checked:ring-primary/20',
        'focus-visible:not-checked:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        'hover:not-disabled:not-checked:aria-invalid:border-destructive/60',
        'disabled:opacity-50',
        'after:bg-background after:size-full after:rounded-full after:transition-[width,height] checked:after:size-1',
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
