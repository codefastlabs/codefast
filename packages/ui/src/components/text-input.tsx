import type { ComponentProps, JSX } from 'react';

import * as InputPrimitive from '@codefast-ui/input';

import type { InputVariantsProps } from '@/variants/input.variants';

import { Spinner } from '@/components/spinner';
import { inputVariants } from '@/variants/input.variants';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

interface TextInputProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentProps<typeof InputPrimitive.Item>, 'prefix' | 'type'> {
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

function TextInput({
  className,
  inputSize,
  loaderPosition,
  loading,
  prefix,
  spinner,
  suffix,
  ...props
}: TextInputProps): JSX.Element {
  return (
    <InputPrimitive.Root
      className={root({ className, inputSize })}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item className={input({ inputSize })} {...props} />
    </InputPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { TextInputProps };
export { TextInput };
