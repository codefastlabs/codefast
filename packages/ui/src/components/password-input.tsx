'use client';

import type { ComponentProps, ComponentPropsWithoutRef, ComponentRef, MouseEventHandler } from 'react';

import * as InputPrimitive from '@codefast-ui/input';
import { EyeClosedIcon, EyeIcon } from 'lucide-react';
import { forwardRef, useCallback, useState } from 'react';

import type { InputVariantsProps } from '@/styles/input-variants';

import { Button } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { inputVariants } from '@/styles/input-variants';

/* -----------------------------------------------------------------------------
 * Variant: PasswordInput
 * -------------------------------------------------------------------------- */

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: PasswordInput
 * -------------------------------------------------------------------------- */

type PasswordInputElement = ComponentRef<typeof InputPrimitive.Item>;
interface PasswordInputProps
  extends InputVariantsProps,
    ComponentProps<typeof InputPrimitive.Root>,
    Omit<ComponentPropsWithoutRef<typeof InputPrimitive.Item>, 'prefix' | 'type'> {}

const PasswordInput = forwardRef<PasswordInputElement, PasswordInputProps>(
  ({ className, inputSize, loaderPosition, loading, prefix, spinner, suffix, ...props }, forwardedRef) => {
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
        <InputPrimitive.Item ref={forwardedRef} className={input({ inputSize })} type={type} {...props} />
        <Button
          icon
          inside
          aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          className="rounded-full"
          disabled={props.disabled}
          prefix={type === 'password' ? <EyeClosedIcon /> : <EyeIcon />}
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

export type { PasswordInputProps };
export { PasswordInput };
