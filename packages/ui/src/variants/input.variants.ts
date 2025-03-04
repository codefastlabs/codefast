import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const inputVariants = tv({
  slots: {
    root: 'border-input bg-background [&>svg]:text-muted-foreground hover:not-has-disabled:not-focus-within:border-input-hover focus-within:border-input-focus focus-within:ring-ring focus-within:ring-3 has-disabled:opacity-50 not-has-disabled:shadow-xs flex w-full grow items-center gap-3 rounded-lg border px-3 text-sm transition [&>svg]:shrink-0',
    input: 'placeholder:text-muted-foreground peer size-full outline-none file:bg-transparent file:font-medium',
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

type InputVariantsProps = VariantProps<typeof inputVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { InputVariantsProps };
export { inputVariants };
