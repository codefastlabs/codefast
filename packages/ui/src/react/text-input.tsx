'use client';

import * as React from 'react';
import { Input, type InputProps, InputSlot, type InputSlotProps } from './input';

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = HTMLInputElement;
interface TextInputProps extends InputProps, Omit<InputSlotProps, 'prefix'> {}

const TextInput = React.forwardRef<TextInputElement, TextInputProps>(
  ({ className, loading, loaderPosition, prefix, suffix, inputSize, ...props }, ref) => {
    return (
      <Input
        className={className}
        inputSize={inputSize}
        loaderPosition={loaderPosition}
        loading={loading}
        prefix={prefix}
        suffix={suffix}
      >
        <InputSlot ref={ref} {...props} />
      </Input>
    );
  },
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { TextInput, type TextInputProps };
