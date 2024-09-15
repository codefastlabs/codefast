import { tv, type VariantProps } from 'tailwind-variants';

const collapsibleVariants = tv({
  slots: {
    content:
      'data-[state=open]:animate-collapsible-open data-[state=closed]:animate-collapsible-closed overflow-hidden',
  },
});

type CollapsibleVariantsProps = VariantProps<typeof collapsibleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { collapsibleVariants, type CollapsibleVariantsProps };
