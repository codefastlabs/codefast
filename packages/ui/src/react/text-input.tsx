'use client';

import * as React from 'react';
import * as InputPrimitive from '@/react/primitive/input';

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = React.ElementRef<typeof InputPrimitive.Item>;
interface TextInputProps
  extends React.ComponentProps<typeof InputPrimitive.Root>,
    Omit<React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>, 'prefix'> {}

const TextInput = React.forwardRef<TextInputElement, TextInputProps>(
  ({ className, loading, loaderPosition, prefix, suffix, inputSize, ...props }, forwardedRef) => {
    return (
      <InputPrimitive.Root
        className={className}
        inputSize={inputSize}
        loaderPosition={loaderPosition}
        loading={loading}
        prefix={prefix}
        suffix={suffix}
      >
        <InputPrimitive.Item ref={forwardedRef} {...props} />
      </InputPrimitive.Root>
    );
  },
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { TextInput, type TextInputProps };
