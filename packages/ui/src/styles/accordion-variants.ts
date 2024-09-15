import { tv, type VariantProps } from 'tailwind-variants';

const accordionVariants = tv({
  slots: {
    header: 'flex',
    trigger: 'group flex flex-1 items-center py-4 text-left text-sm font-medium',
    icon: 'text-muted-foreground size-4 shrink-0 transition group-data-[state=open]:rotate-90',
    content:
      'data-[state=open]:animate-collapsible-open data-[state=closed]:animate-collapsible-closed overflow-hidden text-sm',
    contentContainer: 'pb-4 pt-0',
  },
});

type AccordionVariantsProps = VariantProps<typeof accordionVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { accordionVariants, type AccordionVariantsProps };
