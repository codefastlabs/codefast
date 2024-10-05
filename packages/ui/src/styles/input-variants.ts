import { tv, type VariantProps } from 'tailwind-variants';

const inputVariants = tv({
  slots: {
    root: [
      'border-input flex w-full grow cursor-text items-center gap-2 rounded-md border px-3 text-sm shadow-sm transition',
      '[&>svg]:text-muted-foreground [&>svg]:size-4 [&>svg]:shrink-0',
      'has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-1',
      'has-[input:disabled]:cursor-default has-[input:disabled]:opacity-50',
    ],
    input: [
      'peer size-full bg-inherit outline-none',
      'file:cursor-pointer file:border-0 file:bg-transparent file:font-medium',
      'placeholder:text-muted-foreground',
      'disabled:cursor-default',
    ],
  },
  variants: {
    inputSize: {
      xxs: { root: 'h-7', input: 'file:py-0.75' }, // 28px
      xs: { root: 'h-8', input: 'file:py-1.25' }, // 32px
      sm: { root: 'h-9', input: 'file:py-1.75' }, // 36px
      md: { root: 'h-10', input: 'file:py-2.25' }, // 40px
      lg: { root: 'h-11', input: 'file:py-2.75' }, // 44px
      xl: { root: 'h-12', input: 'file:py-3.25' }, // 48px
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
