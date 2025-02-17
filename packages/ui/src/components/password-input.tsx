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
 * Variant: PasswordInput
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: PasswordInput
 * -------------------------------------------------------------------------- */

interface PasswordInputProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentProps<typeof InputPrimitive.Item>, 'prefix' | 'type'> {}

function PasswordInput({
  className,
  inputSize,
  loaderPosition,
  loading,
  prefix,
  spinner,
  suffix,
  ...props
}: PasswordInputProps): JSX.Element {
  const [type, setType] = useState<'password' | 'text'>('password');

  const togglePasswordVisibility = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    setType((prev) => (prev === 'password' ? 'text' : 'password'));
  }, []);

  return (
    <InputPrimitive.Root
      className={root({ className, inputSize })}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item className={input({ inputSize })} type={type} {...props} />
      <Button
        icon
        inside
        aria-label={type === 'password' ? 'Show password' : 'Hide password'}
        className="rounded-full"
        disabled={props.disabled}
        prefix={type === 'password' ? <EyeOffIcon /> : <EyeIcon />}
        size={inputSize}
        variant="ghost"
        onClick={togglePasswordVisibility}
      />
    </InputPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { PasswordInputProps };
export { PasswordInput };
