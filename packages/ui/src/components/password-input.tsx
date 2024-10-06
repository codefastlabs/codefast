'use client';

import * as React from 'react';
import * as InputPrimitive from '@codefast-ui/input';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import {
  inputVariants,
  type InputVariantsProps,
} from '@/styles/input-variants';
import { Spinner } from '@/components/spinner';
import { Button } from '@/components/button';

/* -----------------------------------------------------------------------------
 * Variant: PasswordInput
 * -------------------------------------------------------------------------- */

const { root, input } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: PasswordInput
 * -------------------------------------------------------------------------- */

type PasswordInputElement = React.ComponentRef<typeof InputPrimitive.Item>;
interface PasswordInputProps
  extends InputVariantsProps,
    React.ComponentProps<typeof InputPrimitive.Root>,
    Omit<
      React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>,
      'prefix' | 'type'
    > {}

const PasswordInput = React.forwardRef<
  PasswordInputElement,
  PasswordInputProps
>(
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
  ) => {
    const [type, setType] = React.useState<'password' | 'text'>('password');

    const togglePasswordVisibility = React.useCallback<
      React.MouseEventHandler<HTMLButtonElement>
    >(() => {
      setType((prev) => (prev === 'password' ? 'text' : 'password'));
    }, []);

    return (
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
          type={type}
          {...props}
        />
        <Button
          icon
          inside
          aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          className="rounded-full"
          disabled={props.disabled}
          prefix={type === 'password' ? <EyeClosedIcon /> : <EyeOpenIcon />}
          size={inputSize}
          variant="ghost"
          onClick={togglePasswordVisibility}
        />
      </InputPrimitive.Root>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { PasswordInput, type PasswordInputProps };
