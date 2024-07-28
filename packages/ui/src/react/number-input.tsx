'use client';

import * as React from 'react';
import * as NumberInputPrimitive from '@/react/primitive/number-input';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

type NumberInputElement = React.ElementRef<typeof NumberInputPrimitive.Item>;
interface NumberInputProps
  extends Omit<
      React.ComponentProps<typeof NumberInputPrimitive.Root>,
      'prefix' | 'suffix' | 'loading' | 'loaderPosition'
    >,
    Omit<React.ComponentPropsWithoutRef<typeof NumberInputPrimitive.Item>, 'prefix'> {}

export const NumberInput = React.forwardRef<NumberInputElement, NumberInputProps>(
  ({ className, inputSize, decrementAriaLabel, incrementAriaLabel, formatOptions, ...props }, forwardedRef) => (
    <NumberInputPrimitive.Root
      className={cn('pr-0', className)}
      decrementAriaLabel={decrementAriaLabel}
      formatOptions={formatOptions}
      incrementAriaLabel={incrementAriaLabel}
      inputSize={inputSize}
      suffix={
        <div className="ml-auto grid h-full divide-y rounded-r-md border-l">
          <NumberInputPrimitive.Button
            className="h-full rounded-none rounded-tr-md"
            iconType="chevron"
            slot="increment"
          />
          <NumberInputPrimitive.Button
            className="h-full rounded-none rounded-br-md"
            iconType="chevron"
            slot="decrement"
          />
        </div>
      }
    >
      <NumberInputPrimitive.Item
        ref={forwardedRef}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        inputMode="numeric"
        spellCheck="false"
        {...props}
      />
    </NumberInputPrimitive.Root>
  ),
);

NumberInput.displayName = 'NumberInput';
