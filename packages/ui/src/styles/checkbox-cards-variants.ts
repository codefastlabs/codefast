import { tv, type VariantProps } from 'tailwind-variants';

const checkboxCardsVariants = tv({
  slots: {
    root: 'grid gap-2',
    itemWrapper: 'flex items-center justify-center gap-4 rounded-md border p-4',
    item: 'border-input aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground peer flex size-4 shrink-0 cursor-pointer rounded-sm border shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50',
    indicator: 'flex size-full items-center justify-center text-current',
  },
});

type CheckboxCardsVariantsProps = VariantProps<typeof checkboxCardsVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { checkboxCardsVariants, type CheckboxCardsVariantsProps };
