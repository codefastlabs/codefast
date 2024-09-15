import { tv, type VariantProps } from 'tailwind-variants';

const inputVariants = tv({
  slots: {
    root: [
      'border-input inline-flex w-full shrink-0 cursor-text items-center gap-2 rounded-md border transition',
      '[&_svg]:size-4 [&_svg]:shrink-0',
      'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2',
      'has-[[type=file]]:cursor-pointer has-[input[disabled]]:cursor-default has-[input[disabled]]:opacity-50',
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
      xxs: { root: 'h-7 px-2', input: 'file:py-0.75' },
      xs: { root: 'h-8 px-2', input: 'file:py-1.25' },
      sm: { root: 'h-9 px-3', input: 'file:py-1.75' },
      md: { root: 'h-10 px-3', input: 'file:py-2.25' },
      lg: { root: 'h-11 px-4', input: 'file:py-2.75' },
      xl: { root: 'h-12 px-4', input: 'file:py-3.25' },
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
