import { tv, type VariantProps } from 'tailwind-variants';

const sheetVariants = tv({
  slots: {
    overlay:
      'data-[state=closed]:animate-duration-300 data-[state=open]:animate-duration-500 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-black/80',
    content:
      'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:animate-duration-300 data-[state=open]:animate-duration-500 animate-ease-in-out fixed z-50 flex flex-col overflow-auto shadow-lg',
    header: 'flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left',
    body: 'px-6 py-2',
    footer: 'flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end',
    title: 'text-foreground text-lg font-semibold',
    description: 'text-muted-foreground text-sm',
  },
  variants: {
    side: {
      top: {
        content:
          'data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top inset-x-0 top-0 max-h-screen border-b',
      },
      bottom: {
        content:
          'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom inset-x-0 bottom-0 max-h-screen border-t',
      },
      left: {
        content:
          'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
      },
      right: {
        content:
          'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
      },
    },
  },
  defaultVariants: {
    side: 'right',
  },
});

type SheetVariantsProps = VariantProps<typeof sheetVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { sheetVariants, type SheetVariantsProps };
