import { tv, type VariantProps } from 'tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    root: 'border-input inline-flex w-full cursor-text items-center gap-3 rounded-md border bg-transparent px-3 shadow-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-0 has-[[disabled]]:cursor-default has-[[type=file]]:cursor-pointer has-[[disabled]]:opacity-50 [&_svg]:size-4',
    input:
      'placeholder:text-muted-foreground peer size-full flex-1 bg-transparent text-sm outline-none file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-default',
  },
  variants: {
    inputSize: {
      default: {
        root: 'h-10',
        input: 'file:py-2.25',
      },
      xs: {
        root: 'h-8',
        input: 'file:py-1.25',
      },
      sm: {
        root: 'h-9',
        input: 'file:py-1.75',
      },
      lg: {
        root: 'h-11',
        input: 'file:py-2.75',
      },
    },
  },
  defaultVariants: {
    inputSize: 'default',
  },
});

type InputVariantsProps = VariantProps<typeof inputVariants>;

const { root, input } = inputVariants();

export { root, input, inputVariants, type InputVariantsProps };
