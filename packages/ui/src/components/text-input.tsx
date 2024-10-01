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

type TextInputElement = React.ComponentRef<typeof InputPrimitive.Item>;
interface TextInputProps
  extends InputVariantsProps,
    React.ComponentProps<typeof InputPrimitive.Root>,
    Omit<React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>, 'prefix'> {}

const TextInput = React.forwardRef<TextInputElement, TextInputProps>(
  ({ className, inputSize, loaderPosition = 'prefix', loading, prefix, spinner, suffix, ...props }, forwardedRef) => (
    <InputPrimitive.Root
      className={root({ inputSize, className })}
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

export { TextInput, type TextInputProps };
