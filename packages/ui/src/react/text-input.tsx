'use client';

import * as React from 'react';
import { InputItem, type InputItemProps, InputRoot, type InputRootProps } from '@/react/primitive/input';

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = HTMLInputElement;
interface TextInputProps extends InputRootProps, Omit<InputItemProps, 'prefix'> {}

const TextInput = React.forwardRef<TextInputElement, TextInputProps>(
  ({ className, loading, loaderPosition, prefix, suffix, inputSize, ...props }, forwardedRef) => {
    return (
      <InputRoot
        className={className}
        inputSize={inputSize}
        loaderPosition={loaderPosition}
        loading={loading}
        prefix={prefix}
        suffix={suffix}
      >
        <InputItem ref={forwardedRef} {...props} />
      </InputRoot>
    );
  },
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { TextInput, type TextInputProps };
