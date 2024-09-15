import { tv, type VariantProps } from 'tailwind-variants';

const textareaVariants = tv({
  base: [
    'border-input flex min-h-16 w-full rounded-md border bg-transparent py-2 text-sm',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'placeholder:text-muted-foreground',
    'disabled:cursor-default disabled:opacity-50',
  ],
  variants: {
    inputSize: {
      xxs: 'px-2',
      xs: 'px-2',
      sm: 'px-3',
      md: 'px-3',
      lg: 'px-4',
      xl: 'px-4',
    },
  },
  defaultVariants: {
    inputSize: 'md',
  },
});

type TextareaVariantsProps = VariantProps<typeof textareaVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { textareaVariants, type TextareaVariantsProps };
