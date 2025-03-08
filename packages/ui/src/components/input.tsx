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
 * Component: Input
 * -------------------------------------------------------------------------- */

function Input({
  className,
  disabled,
  inputSize,
  loaderPosition,
  loading,
  prefix,
  readOnly,
  spinner,
  suffix,
  ...props
}: ComponentProps<typeof InputPrimitive.Root> &
  InputVariantsProps &
  Omit<ComponentProps<typeof InputPrimitive.Item>, 'prefix' | 'type'> & {
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
  }): JSX.Element {
  return (
    <InputPrimitive.Root
      className={root({ className, inputSize })}
      data-slot="input"
      disabled={disabled}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      readOnly={readOnly}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item className={input({ inputSize })} data-slot="input-item" {...props} />
    </InputPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Deprecated
 * -------------------------------------------------------------------------- */

/**
 * @deprecated
 * This component is an alias of the Input component.
 * Please use the Input component instead to ensure consistency.
 */
const TextInput = Input;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Input, TextInput };
