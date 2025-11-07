import { tv } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

const sheetContentVariants = tv({
  base: "bg-background ease-ui data-[state=open]:animate-in data-[state=open]:animation-duration-500 data-[state=closed]:animate-out data-[state=closed]:animation-duration-500 fixed z-50 flex flex-col overflow-auto shadow-lg",
  defaultVariants: {
    side: "right",
  },
  variants: {
    side: {
      bottom:
        "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom inset-x-0 bottom-0 max-h-[80vh] border-t",
      left: "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right:
        "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      top: "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top inset-x-0 top-0 max-h-[80vh] border-b",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { sheetContentVariants };
