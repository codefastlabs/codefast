import { tv, type VariantProps } from 'tailwind-variants';

const drawerVariants = tv({
  slots: {
    overlay: 'fixed inset-0 z-50 bg-black/80',
    content: 'bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-xl border',
    handle: 'bg-muted mx-auto mt-4 h-2 w-24 rounded-full',
    header: 'grid gap-1.5 p-4 text-center sm:text-left',
    body: 'overflow-auto px-4 py-2',
    footer: 'mt-auto flex flex-col-reverse gap-2 p-4',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-muted-foreground text-sm',
  },
});

type DrawerVariantsProps = VariantProps<typeof drawerVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { drawerVariants, type DrawerVariantsProps };
