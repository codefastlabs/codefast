import { tv, type VariantProps } from 'tailwind-variants';

const cardVariants = tv({
  slots: {
    root: 'bg-card text-card-foreground rounded-lg border shadow-sm',
    header: 'flex flex-col space-y-1.5 p-6',
    title: 'font-semibold leading-none tracking-tight',
    description: 'text-muted-foreground text-sm',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
  },
});

type CardVariantsProps = VariantProps<typeof cardVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { cardVariants, type CardVariantsProps };
