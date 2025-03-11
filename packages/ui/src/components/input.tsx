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
    root: [
      'border-input bg-background peer flex h-9 w-full grow items-center gap-3 rounded-lg border px-3 text-sm transition',
      "[&>svg]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
      'not-has-disabled:shadow-xs',
      'hover:not-has-disabled:not-focus-within:border-input-hover',
      'focus-within:border-input-focus focus-within:ring-ring focus-within:ring-3',
      'has-aria-invalid:border-destructive/60',
      'hover:not-has-disabled:not-focus-within:has-aria-invalid:border-destructive/80',
      'focus-within:border-destructive focus-within:has-aria-invalid:ring-destructive/20',
      'has-disabled:opacity-50',
    ],
    input:
      'placeholder:text-muted-foreground outline-hidden file:py-1.75 size-full file:bg-transparent file:font-medium',
  },
});

const { input, root } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: Input
 * -------------------------------------------------------------------------- */

function Input({
  className,
  disabled,
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
      className={root({ className })}
      data-slot="input"
      disabled={disabled}
      loaderPosition={loaderPosition}
      loading={loading}
      prefix={prefix}
      readOnly={readOnly}
      spinner={spinner || <Spinner />}
      suffix={suffix}
    >
      <InputPrimitive.Item className={input()} data-slot="input-item" {...props} />
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
