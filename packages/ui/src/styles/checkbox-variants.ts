import { tv, type VariantProps } from 'tailwind-variants';

const checkboxVariants = tv({
  slots: {
    root: 'border-input hover:border-primary aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground peer flex size-4 shrink-0 rounded-sm border shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50',
    indicator: 'flex size-full items-center justify-center text-current',
  },
});

type CheckboxVariantsProps = VariantProps<typeof checkboxVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { checkboxVariants, type CheckboxVariantsProps };
