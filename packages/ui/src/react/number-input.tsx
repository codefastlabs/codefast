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
    React.ComponentProps<typeof NumberInputPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof NumberInputPrimitive.Item> {}

const NumberInput = React.forwardRef<NumberInputElement, NumberInputProps>(
  (
    {
      className,
      inputSize,
      value,
      onChange,
      defaultValue,
      ariaDecrementLabel,
      ariaIncrementLabel,
      formatOptions,
      disabled,
      readOnly,
      min,
      max,
      step,
      ...props
    },
    forwardedRef,
  ) => (
    <NumberInputPrimitive.Root
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      className={root({ inputSize, className: 'pr-0' })}
      defaultValue={defaultValue}
      disabled={disabled}
      formatOptions={formatOptions}
      max={max}
      min={min}
      readOnly={readOnly}
      step={step}
      value={value}
      onChange={onChange}
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