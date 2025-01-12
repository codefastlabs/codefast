import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const inputVariants = tv({
  defaultVariants: {
    inputSize: 'md',
  },
  slots: {
    input: [
      'peer size-full rounded-[inherit] bg-inherit outline-none',
      'file:cursor-pointer file:border-0 file:bg-transparent file:font-medium',
      'placeholder:text-muted-foreground',
      'disabled:cursor-default',
    ],
    root: [
      'border-input bg-background shadow-xs flex w-full grow cursor-text items-center gap-2 rounded-md border px-3 text-sm transition',
      '[&>svg]:text-muted-foreground [&>svg]:shrink-0',
      'focus-within:border-ring focus-within:ring-ring/40 focus-within:ring-2',
      'has-[input:disabled]:cursor-default has-[input:disabled]:opacity-50',
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
});

type InputVariantsProps = VariantProps<typeof inputVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { InputVariantsProps };
export { inputVariants };
