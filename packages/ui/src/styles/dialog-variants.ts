import { tv, type VariantProps } from 'tailwind-variants';

const dialogVariants = tv({
  slots: {
    overlay: [
      'fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/80 p-4 sm:pb-12 sm:pt-8',
      'data-[state=open]:animate-duration-200 data-[state=open]:animate-fade-in',
      'data-[state=closed]:animate-duration-200 data-[state=closed]:animate-fade-out',
    ],
    content: [
      'bg-background relative z-50 flex w-full max-w-lg flex-col rounded-lg border shadow-lg',
      'data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:animate-duration-200 data-[state=open]:fade-in',
      'data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:animate-duration-200 data-[state=closed]:fade-out',
    ],
    header: 'flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left',
    body: 'overflow-auto px-6 py-2',
    footer: 'flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-muted-foreground text-sm',
  },
});

type DialogVariantsProps = VariantProps<typeof dialogVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { dialogVariants, type DialogVariantsProps };
