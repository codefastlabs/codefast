import { tv, type VariantProps } from 'tailwind-variants';

const separatorVariants = tv({
  slots: {
    root: 'bg-border relative flex shrink-0 items-center',
    item: 'bg-background text-muted-foreground absolute mx-2 px-2 text-sm',
  },
  variants: {
    align: {
      start: { root: 'justify-start' },
      center: { root: 'justify-center' },
      end: { root: 'justify-end' },
    },
    orientation: {
      horizontal: { root: 'h-px w-full' },
      vertical: { root: 'h-full w-px flex-col' },
    },
  },
  defaultVariants: {
    align: 'center',
    orientation: 'horizontal',
  },
});

type SeparatorVariantsProps = VariantProps<typeof separatorVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { separatorVariants, type SeparatorVariantsProps };
