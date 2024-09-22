'use client';

import * as React from 'react';
import * as NumberInputPrimitive from '@codefast/primitive/number-input';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { buttonVariants } from '@/styles/button-variants';
import { inputVariants, type InputVariantsProps } from '@/styles/input-variants';

const { root, input } = inputVariants();

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
      ariaDecrementLabel,
      ariaIncrementLabel,
      className,
      inputSize,
      defaultValue,
      disabled,
      formatOptions,
      id,
      max,
      min,
      readOnly,
      step,
      value,
      onChange,
      ...props
    },
    forwardedRef,
  ) => (
    <NumberInputPrimitive.Root
      ariaDecrementLabel={ariaDecrementLabel}
      ariaIncrementLabel={ariaIncrementLabel}
      className={root({ inputSize, className: ['pr-0', className] })}
      defaultValue={defaultValue}
      disabled={disabled}
      formatOptions={formatOptions}
      id={id}
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
        className={input({ inputSize })}
        inputMode="numeric"
        spellCheck="false"
        {...props}
      />
      <div className="ml-auto grid h-full divide-y rounded-r-md border-l">
        <NumberInputPrimitive.IncrementButton
          className={buttonVariants({
            className: 'h-full rounded-none rounded-tr-md',
            icon: true,
            variant: 'ghost',
          })}
        >
          <ChevronUpIcon />
        </NumberInputPrimitive.IncrementButton>
        <NumberInputPrimitive.DecrementButton
          className={buttonVariants({
            className: 'rounded-tb-md h-full rounded-none',
            icon: true,
            variant: 'ghost',
          })}
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
