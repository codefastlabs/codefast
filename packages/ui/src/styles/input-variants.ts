import { tv, type VariantProps } from 'tailwind-variants';

const inputVariants = tv({
  slots: {
    root: [
      'border-input inline-flex w-full shrink-0 cursor-text items-center rounded-md border transition',
      '[&_svg]:text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0',
      'has-[[type=file]]:cursor-pointer',
      'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
      'has-[input[disabled]]:cursor-default has-[input[disabled]]:opacity-50',
    ],
    input: [
      'peer size-full flex-1 bg-inherit text-sm outline-none autofill:bg-inherit',
      'file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-muted-foreground',
      'disabled:cursor-default',
    ],
  },
  variants: {
    inputSize: {
      xxs: { root: 'h-7 gap-2.5 px-2.5', input: 'file:py-0.75' }, // 28px
      xs: { root: 'px-2.75 gap-2.75 h-8', input: 'file:py-1.25' }, // 32px
      sm: { root: 'h-9 gap-3 px-3', input: 'file:py-1.75' }, // 36px
      md: { root: 'px-3.25 gap-3.25 h-10', input: 'file:py-2.25' }, // 40px
      lg: { root: 'h-11 gap-3.5 px-3.5', input: 'file:py-2.75' }, // 44px
      xl: { root: 'px-3.75 gap-3.75 h-12', input: 'file:py-3.25' }, // 48px
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

export { inputVariants, type InputVariantsProps };
