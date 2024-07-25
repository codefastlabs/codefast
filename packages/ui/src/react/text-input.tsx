'use client';

import * as React from 'react';
import { Input, type InputProps, InputRoot, type InputRootProps } from '@/react/primitive/input';

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = HTMLInputElement;
interface TextInputProps extends InputRootProps, Omit<InputProps, 'prefix'> {}

const TextInput = React.forwardRef<TextInputElement, TextInputProps>(
  ({ className, loading, loaderPosition, prefix, suffix, inputSize, ...props }, ref) => {
    return (
      <InputRoot
        className={className}
        inputSize={inputSize}
        loaderPosition={loaderPosition}
        loading={loading}
        prefix={prefix}
        suffix={suffix}
      >
        <Input ref={ref} {...props} />
      </InputRoot>
    );
  },
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { TextInput, type TextInputProps };
