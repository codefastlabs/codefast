import type { ComponentProps, ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as InputPrimitive from '@codefast-ui/input';
import { forwardRef } from 'react';

import type { InputVariantsProps } from '@/styles/input-variants';

import { Spinner } from '@/components/spinner';
import { inputVariants } from '@/styles/input-variants';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = ComponentRef<typeof InputPrimitive.Item>;
interface TextInputProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentPropsWithoutRef<typeof InputPrimitive.Item>, 'prefix' | 'type'> {
  type?:
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'month'
    | 'number'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week';
}

const TextInput = forwardRef<TextInputElement, TextInputProps>(
  ({ className, inputSize, loaderPosition, loading, prefix, spinner, suffix, ...props }, forwardedRef) => (
    <InputPrimitive.Root
      className={root({ className, inputSize })}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item ref={forwardedRef} className={input({ inputSize })} {...props} />
    </InputPrimitive.Root>
  ),
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { TextInputProps };
export { TextInput };
