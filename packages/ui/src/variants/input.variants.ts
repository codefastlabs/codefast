import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const inputVariants = tv({
  slots: {
    root: [
      'border-input shadow-input bg-background flex w-full grow items-center gap-2 rounded-lg border px-3 text-sm shadow-sm transition',
      '[&>svg]:text-muted-foreground [&>svg]:shrink-0',
      'hover:not-data-disabled:not-focus-within:border-input-hover',
      'focus-within:border-input-focus focus-within:ring-ring focus-within:ring-3',
      'has-disabled:opacity-50',
    ],
    input: [
      'peer size-full rounded-[inherit] bg-inherit outline-none',
      'file:bg-background file:border-0 file:font-medium',
      'placeholder:text-muted-foreground',
    ],
  },
  variants: {
    inputSize: {
      lg: { input: 'file:py-2.75', root: 'h-11 [&>svg]:size-5' }, // 44px
      md: { input: 'file:py-2.25', root: 'h-10 [&>svg]:size-4' }, // 40px
      sm: { input: 'file:py-1.75', root: 'h-9 [&>svg]:size-4' }, // 36px
      xl: { input: 'file:py-3.25', root: 'h-12 [&>svg]:size-5' }, // 48px
      xs: { input: 'file:py-1.25', root: 'h-8 [&>svg]:size-3.5' }, // 32px
      xxs: { input: 'file:py-0.75', root: 'h-7 [&>svg]:size-3' }, // 28px
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
