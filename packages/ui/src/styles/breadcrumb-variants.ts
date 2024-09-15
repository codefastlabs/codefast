import { tv, type VariantProps } from 'tailwind-variants';

const breadcrumbVariants = tv({
  slots: {
    list: 'text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5',
    item: 'inline-flex items-center gap-1.5',
    link: 'hover:text-foreground transition',
    page: 'text-foreground font-normal',
    ellipsis: 'flex items-center justify-center',
  },
});

type BreadcrumbVariantsProps = VariantProps<typeof breadcrumbVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { breadcrumbVariants, type BreadcrumbVariantsProps };
