import * as InputPrimitive from '@codefast-ui/input';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';
import { Spinner } from '@/components/spinner';
import {
  inputVariants,
  type InputVariantsProps,
} from '@/styles/input-variants';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const { root, input } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = ComponentRef<typeof InputPrimitive.Item>;
interface TextInputProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<
      ComponentPropsWithoutRef<typeof InputPrimitive.Item>,
      'prefix' | 'type'
    > {
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'month'
    | 'week'
    | 'file'
    | 'search';
}

const TextInput = forwardRef<TextInputElement, TextInputProps>(
  (
    {
      className,
      inputSize,
      loaderPosition,
      loading,
      prefix,
      spinner,
      suffix,
      ...props
    },
    forwardedRef,
  ) => (
    <InputPrimitive.Root
      className={root({ inputSize, className })}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item
        ref={forwardedRef}
        className={input({ inputSize })}
        {...props}
      />
    </InputPrimitive.Root>
  ),
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { TextInput, type TextInputProps };
