import * as React from 'react';
import * as InputPrimitive from '@/react/primitive/input';
import * as NumberInputPrimitive from '@/react/primitive/number-input';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

type NumberInputElement = HTMLInputElement;
interface NumberInputProps
  extends Omit<NumberInputPrimitive.NumberInputRootProps, 'prefix' | 'suffix' | 'loading' | 'loaderPosition'>,
    Omit<InputPrimitive.InputItemProps, 'prefix'> {}

export const NumberInput = React.forwardRef<NumberInputElement, NumberInputProps>(
  ({ className, inputSize, decrementAriaLabel, incrementAriaLabel, formatOptions, ...props }, forwardedRef) => (
    <NumberInputPrimitive.Root
      className={cn('pr-0', className)}
      decrementAriaLabel={decrementAriaLabel}
      formatOptions={formatOptions}
      incrementAriaLabel={incrementAriaLabel}
      inputSize={inputSize}
      suffix={
        <div className="grid h-full divide-y rounded-r-md border-l">
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
      <InputPrimitive.Item ref={forwardedRef} inputMode="numeric" {...props} />
    </NumberInputPrimitive.Root>
  ),
);

NumberInput.displayName = 'NumberInput';
