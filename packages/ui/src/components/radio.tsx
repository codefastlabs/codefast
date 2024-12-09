'use client';

import { composeEventHandlers } from '@radix-ui/primitive';
import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Radio
 * -------------------------------------------------------------------------- */

type RadioElement = HTMLInputElement;
interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

const Radio = forwardRef<RadioElement, RadioProps>(({ className, onChange, onValueChange, ...props }, forwardedRef) => (
  <input
    ref={forwardedRef}
    className={cn(
      'peer appearance-none',
      'border-input inline-flex size-4 shrink-0 items-center justify-center rounded-full border shadow-sm transition',
      'hover:border-primary',
      'checked:border-primary checked:bg-primary',
      'after:bg-background after:size-full after:rounded-full after:transition-[width,height]',
      'checked:after:size-1',
      'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    type="radio"
    onChange={composeEventHandlers(onChange, (event) => onValueChange?.(event.currentTarget.value))}
    {...props}
  />
));

Radio.displayName = 'Radio';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Radio };
