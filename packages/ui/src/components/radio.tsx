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

const Radio = forwardRef<RadioElement, RadioProps>(({ className, onValueChange, onChange, ...props }, forwardedRef) => (
  <input
    ref={forwardedRef}
    className={cn(
      'peer relative flex appearance-none items-center justify-center rounded-full shadow-sm transition',
      'before:border-input before:size-4 before:rounded-full before:border before:transition',
      'hover:before:border-primary',
      'checked:before:border-primary checked:before:bg-primary',
      'checked:after:bg-background checked:after:absolute checked:after:size-1 checked:after:rounded-full',
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
