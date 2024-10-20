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
      'hover:before:border-primary checked:before:border-primary before:border-input before:size-4 before:rounded-full before:border',
      'checked:after:bg-primary checked:after:absolute checked:after:size-2.5 checked:after:rounded-full',
      'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
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
