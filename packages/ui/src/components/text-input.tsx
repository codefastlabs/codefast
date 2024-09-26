'use client';

import * as React from 'react';
import * as InputPrimitive from '@codefast-ui/input';
import { Spinner } from '@/components/spinner';
import { inputVariants, type InputVariantsProps } from '@/styles/input-variants';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const { root, input } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = React.ElementRef<typeof InputPrimitive.Item>;
interface TextInputProps
  extends InputVariantsProps,
    React.ComponentProps<typeof InputPrimitive.Root>,
    Omit<React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>, 'prefix'> {
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const TextInput = React.forwardRef<TextInputElement, TextInputProps>(
  ({ inputSize, className, loading, loaderPosition, prefix, suffix, ...props }, forwardedRef) => (
    <InputPrimitive.Root className={root({ inputSize, className })}>
      {loading && loaderPosition === 'prefix' ? <Spinner /> : prefix}
      <InputPrimitive.Item ref={forwardedRef} className={input({ inputSize })} {...props} />
      {loading && loaderPosition === 'suffix' ? <Spinner /> : suffix}
    </InputPrimitive.Root>
  ),
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { TextInput, type TextInputProps };
