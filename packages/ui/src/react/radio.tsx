'use client';

import * as React from 'react';
import { composeEventHandlers } from '@radix-ui/primitive';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Radio
 * -------------------------------------------------------------------------- */

type RadioElement = HTMLInputElement;

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

const Radio = React.forwardRef<RadioElement, RadioProps>(({ className, onValueChange, onChange, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'before:border-input hover:before:border-primary checked:before:border-primary checked:after:bg-primary peer relative flex appearance-none items-center justify-center rounded-full before:size-4 before:rounded-full before:border checked:after:absolute checked:after:size-2.5 checked:after:rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      type="radio"
      onChange={composeEventHandlers(onChange, (event) => onValueChange?.(event.currentTarget.value))}
      {...props}
    />
  );
});

Radio.displayName = 'Radio';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Radio };
