'use client';

import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/tailwind-variants';
import { composeEventHandlers } from '@radix-ui/primitive';

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
        'border-input hover:not-disabled:not-checked:border-ring/60 focus-visible:not-checked:border-ring focus-visible:ring-ring/50 focus-visible:checked:ring-primary/20 dark:focus-visible:checked:ring-primary/40 checked:border-primary checked:bg-primary checked:aria-invalid:bg-destructive aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 hover:not-disabled:not-checked:aria-invalid:border-destructive/60 after:bg-background dark:not-checked:after:bg-input/30 peer inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border shadow-xs outline-hidden after:size-full after:rounded-full after:transition-[width,height] checked:after:size-1 focus-visible:ring-3 disabled:opacity-50',
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
export type { RadioProps };
