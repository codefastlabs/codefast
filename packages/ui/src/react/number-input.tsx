'use client';

import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import * as NumberInputPrimitive from '@/react/primitive/number-input';
import { input, type InputVariantsProps, root } from '@/react/style/input';
import { buttonVariants } from '@/react/button';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

type NumberInputElement = React.ElementRef<typeof NumberInputPrimitive.Item>;
interface NumberInputProps
  extends InputVariantsProps,
    Omit<React.ComponentProps<typeof NumberInputPrimitive.Root>, 'prefix' | 'suffix' | 'loading' | 'loaderPosition'>,
    Omit<React.ComponentPropsWithoutRef<typeof NumberInputPrimitive.Item>, 'prefix'> {}

const NumberInput = React.forwardRef<NumberInputElement, NumberInputProps>(
  ({ className, inputSize, decrementAriaLabel, incrementAriaLabel, formatOptions, ...props }, forwardedRef) => (
    <NumberInputPrimitive.Root
      className={root({ inputSize, className: 'pr-0' })}
      decrementAriaLabel={decrementAriaLabel}
      formatOptions={formatOptions}
      incrementAriaLabel={incrementAriaLabel}
    >
      <NumberInputPrimitive.Item
        ref={forwardedRef}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        className={input({ inputSize, className })}
        inputMode="numeric"
        spellCheck="false"
        {...props}
      />
      <div className="ml-auto grid h-full divide-y rounded-r-md border-l">
        <NumberInputPrimitive.IncrementButton
          className={buttonVariants({ size: 'icon', variant: 'ghost', className: 'h-full rounded-none rounded-tr-md' })}
        >
          <ChevronUpIcon />
        </NumberInputPrimitive.IncrementButton>
        <NumberInputPrimitive.DecrementButton
          className={buttonVariants({ size: 'icon', variant: 'ghost', className: 'rounded-tb-md h-full rounded-none' })}
        >
          <ChevronDownIcon />
        </NumberInputPrimitive.DecrementButton>
      </div>
    </NumberInputPrimitive.Root>
  ),
);

NumberInput.displayName = 'NumberInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { NumberInput, type NumberInputProps };
