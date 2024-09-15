import { tv, type VariantProps } from 'tailwind-variants';

const checkboxGroupVariants = tv({
  slots: {
    root: 'grid gap-2',
    item: [
      'border-input peer flex size-4 shrink-0 rounded-sm border',
      'hover:border-primary',
      'aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    indicator: 'flex size-full items-center justify-center text-current',
  },
});

type CheckboxGroupVariantsProps = VariantProps<typeof checkboxGroupVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { checkboxGroupVariants, type CheckboxGroupVariantsProps };
