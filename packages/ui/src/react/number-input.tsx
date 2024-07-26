import * as React from 'react';
import { InputItem, type InputItemProps } from '@/react/primitive/input';
import { NumberInputButton, NumberInputRoot, type NumberInputRootProps } from '@/react/primitive/number-input';

/* -----------------------------------------------------------------------------
 * Component: NumberInput
 * -------------------------------------------------------------------------- */

type NumberInputElement = HTMLInputElement;
interface NumberInputProps extends Pick<NumberInputRootProps, 'inputSize'>, Omit<InputItemProps, 'prefix'> {}

export const NumberInput = React.forwardRef<NumberInputElement, NumberInputProps>(
  ({ className, inputSize, ...props }, forwardedRef) => {
    return (
      <NumberInputRoot
        className={className}
        inputSize={inputSize}
        suffix={
          <div className="">
            <NumberInputButton iconType="chevron" slot="increment" />
            <NumberInputButton iconType="chevron" slot="decrement" />
          </div>
        }
      >
        <InputItem ref={forwardedRef} {...props} />
      </NumberInputRoot>
    );
  },
);

NumberInput.displayName = 'NumberInput';
