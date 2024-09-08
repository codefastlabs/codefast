'use client';

import * as React from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import * as InputPrimitive from '@codefast/primitive/input';
import { Spinner } from '@/components/spinner';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    root: [
      'border-input inline-flex w-full cursor-text items-center gap-3 rounded-md border bg-transparent px-3 transition [&_svg]:size-4',
      'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
      'has-[[disabled]]:cursor-default has-[[type=file]]:cursor-pointer has-[[disabled]]:opacity-50',
    ],
    input: [
      'peer size-full flex-1 bg-transparent text-sm outline-none autofill:bg-transparent',
      'file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'disabled:cursor-default',
      'placeholder:text-muted-foreground',
    ],
  },
  variants: {
    inputSize: {
      xxs: { root: 'h-7', input: 'file:py-0.75' },
      xs: { root: 'h-8', input: 'file:py-1.25' },
      sm: { root: 'h-9', input: 'file:py-1.75' },
      md: { root: 'h-10', input: 'file:py-2.25' },
      lg: { root: 'h-11', input: 'file:py-2.75' },
      xl: { root: 'h-12', input: 'file:py-3.25' },
    },
  },
  defaultVariants: {
    inputSize: 'md',
  },
});

type InputVariantsProps = VariantProps<typeof inputVariants>;

const { root, input } = inputVariants();

/* -----------------------------------------------------------------------------
 * Component: TextInput
 * -------------------------------------------------------------------------- */

type TextInputElement = React.ElementRef<typeof InputPrimitive.Item>;
interface TextInputProps
  extends InputVariantsProps,
    React.ComponentProps<typeof InputPrimitive.Root>,
    Omit<React.ComponentPropsWithoutRef<typeof InputPrimitive.Item>, 'prefix'> {
  loaderPosition?: 'prefix' | 'suffix';
  loading?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const TextInput = React.forwardRef<TextInputElement, TextInputProps>(
  ({ inputSize, className, loading, loaderPosition, prefix, suffix, ...props }, forwardedRef) => (
    <InputPrimitive.Root className={root({ inputSize, className })}>
      {loading && loaderPosition === 'prefix' ? <Spinner /> : prefix}
      <InputPrimitive.Item ref={forwardedRef} className={input({ inputSize })} {...props} />
      {loading && loaderPosition === 'suffix' ? <Spinner /> : suffix}
    </InputPrimitive.Root>
  ),
);

TextInput.displayName = 'TextInput';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { TextInput, type TextInputProps, inputVariants, type InputVariantsProps };
