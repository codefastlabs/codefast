'use client';

import * as InputPrimitive from '@codefast-ui/input';
import { EyeClosedIcon, EyeIcon } from 'lucide-react';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type MouseEventHandler,
  useCallback,
  useState,
} from 'react';

import { Button } from '@/components/button';
import { Spinner } from '@/components/spinner';
import { inputVariants, type InputVariantsProps } from '@/styles/input-variants';

/* -----------------------------------------------------------------------------
 * Variant: PasswordInput
 * -------------------------------------------------------------------------- */

const { root, input } = inputVariants();

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
        className={root({ inputSize, className })}
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

export { PasswordInput, type PasswordInputProps };
