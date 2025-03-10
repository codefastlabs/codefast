import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as InputPrimitive from '@codefast-ui/input';
import { tv } from 'tailwind-variants';

import { Spinner } from '@/components/spinner';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    root: 'border-input bg-background [&>svg]:text-muted-foreground hover:not-has-disabled:not-focus-within:border-input-hover focus-within:border-input-focus focus-within:ring-ring focus-within:ring-3 has-disabled:opacity-50 not-has-disabled:shadow-xs peer flex w-full grow items-center gap-3 rounded-lg border px-3 text-sm transition-[color,box-shadow,border-color,background-color] [&>svg]:shrink-0',
    input: 'placeholder:text-muted-foreground outline-hidden size-full file:bg-transparent file:font-medium',
  },
  variants: {
    inputSize: {
      '2xs': { root: 'h-7 [&>svg]:size-3', input: 'file:py-0.75' }, // 28px
      xs: { root: 'h-8 [&>svg]:size-3.5', input: 'file:py-1.25' }, // 32px
      sm: { root: 'h-9 [&>svg]:size-4', input: 'file:py-1.75' }, // 36px
      md: { root: 'h-10 [&>svg]:size-4', input: 'file:py-2.25' }, // 40px
      lg: { root: 'h-11 [&>svg]:size-5', input: 'file:py-2.75' }, // 44px
      xl: { root: 'h-12 [&>svg]:size-5', input: 'file:py-3.25' }, // 48px
    },
  },
  defaultVariants: {
    inputSize: 'md',
  },
});

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
  Omit<ComponentProps<typeof InputPrimitive.Item>, 'prefix' | 'type'> &
  VariantProps<typeof inputVariants> & {
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

export { Input, inputVariants, TextInput };
