import { tv, type VariantProps } from 'tailwind-variants';

const alertVariants = tv({
  slots: {
    root: '[&>svg+div]:-translate-y-0.75 relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
    title: 'mb-1 font-medium leading-none tracking-tight',
    description: 'text-sm [&_p]:leading-relaxed',
  },
  variants: {
    variant: {
      default: { root: 'bg-background text-foreground [&>svg]:text-foreground' },
      destructive: { root: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive' },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type AlertVariantsProps = VariantProps<typeof alertVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { alertVariants, type AlertVariantsProps };
