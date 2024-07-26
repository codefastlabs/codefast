import * as React from 'react';
import { InputItem, type InputItemProps } from '@/react/primitive/input';
import { NumberInputButton, NumberInputRoot, type NumberInputRootProps } from '@/react/primitive/number-input';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

type NumberInputElement = HTMLInputElement;
interface NumberInputProps
  extends Omit<NumberInputRootProps, 'prefix' | 'suffix' | 'loading' | 'loaderPosition'>,
    Omit<InputItemProps, 'prefix'> {}

export const NumberInput = React.forwardRef<NumberInputElement, NumberInputProps>(
  ({ className, inputSize, decrementAriaLabel, incrementAriaLabel, formatOptions, ...props }, forwardedRef) => (
    <NumberInputRoot
      className={cn('pr-0', className)}
      decrementAriaLabel={decrementAriaLabel}
      formatOptions={formatOptions}
      incrementAriaLabel={incrementAriaLabel}
      inputSize={inputSize}
      suffix={
        <div className="grid h-full divide-y rounded-r-md border-l">
          <NumberInputButton className="h-full rounded-none rounded-tr-md" iconType="chevron" slot="increment" />
          <NumberInputButton className="h-full rounded-none rounded-br-md" iconType="chevron" slot="decrement" />
        </div>
      }
    >
      <InputItem ref={forwardedRef} inputMode="numeric" {...props} />
    </NumberInputRoot>
  ),
);

NumberInput.displayName = 'NumberInput';
