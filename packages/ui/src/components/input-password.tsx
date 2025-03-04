'use client';

import type { ComponentProps, JSX, MouseEventHandler } from 'react';

import * as InputPrimitive from '@codefast-ui/input';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { InputVariantsProps } from '@/variants/input.variants';

import { Button } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { inputVariants } from '@/variants/input.variants';

/* -----------------------------------------------------------------------------
 * Variant: InputPassword
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: InputPassword
 * -------------------------------------------------------------------------- */

interface InputPasswordProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentProps<typeof InputPrimitive.Item>, 'prefix' | 'type'> {}

function InputPassword({
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
}: InputPasswordProps): JSX.Element {
  const [type, setType] = useState<'password' | 'text'>('password');

  const togglePasswordVisibility = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    setType((prev) => (prev === 'password' ? 'text' : 'password'));
  }, []);

  return (
    <InputPrimitive.Root
      className={root({ className, inputSize })}
      disabled={disabled}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      readOnly={readOnly}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item className={input({ inputSize })} type={type} {...props} />
      <Button
        icon
        inside
        aria-label={type === 'password' ? 'Show password' : 'Hide password'}
        className="rounded-full"
        disabled={disabled}
        prefix={type === 'password' ? <EyeOffIcon /> : <EyeIcon />}
        size={inputSize}
        variant="ghost"
        onClick={togglePasswordVisibility}
      />
    </InputPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Deprecated
 * -------------------------------------------------------------------------- */

/**
 * @deprecated
 * This type is an alias of the InputPasswordProps type.
 * Please use the InputPasswordProps type instead to ensure consistency.
 */
type PasswordInputProps = InputPasswordProps;

/**
 * @deprecated
 * This component is an alias of the Input component.
 * Please use the Input component instead to ensure consistency.
 */
const PasswordInput = InputPassword;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { InputPasswordProps, PasswordInputProps };
export { InputPassword, PasswordInput };
