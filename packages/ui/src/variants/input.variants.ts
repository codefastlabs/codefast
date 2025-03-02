import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const inputVariants = tv({
  slots: {
    root: 'border-input shadow-input bg-background [&>svg]:text-muted-foreground hover:not-data-[disabled=true]:not-focus-within:border-input-hover focus-within:border-input-focus focus-within:ring-ring focus-within:ring-3 has-disabled:opacity-50 flex w-full grow items-center gap-3 rounded-lg border px-3 text-sm shadow-sm transition [&>svg]:shrink-0',
    input: 'placeholder:text-muted-foreground peer size-full outline-none file:bg-transparent file:font-medium',
  },
  variants: {
    inputSize: {
      '2xs': {
        root: 'h-7 [&>svg]:size-3', // 28px
        input: 'file:py-0.75',
      },
      xs: {
        root: 'h-8 [&>svg]:size-3.5', // 32px
        input: 'file:py-1.25',
      },
      sm: {
        root: 'h-9 [&>svg]:size-4', // 36px
        input: 'file:py-1.75',
      },
      md: {
        root: 'h-10 [&>svg]:size-4', // 40px
        input: 'file:py-2.25',
      },
      lg: {
        root: 'h-11 [&>svg]:size-5', // 44px
        input: 'file:py-2.75',
      },
      xl: {
        root: 'h-12 [&>svg]:size-5', // 48px
        input: 'file:py-3.25',
      },
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
