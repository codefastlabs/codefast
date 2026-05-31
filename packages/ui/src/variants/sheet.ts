import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const sheetContentVariants = tv({
  base: "fixed z-50 flex flex-col overflow-auto bg-popover text-popover-foreground shadow-lg ease-ui motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0 data-open:animate-in data-open:animation-duration-500 data-closed:animate-out data-closed:animation-duration-500",
  defaultVariants: {
    side: "right",
  },
  variants: {
    side: {
      bottom:
        "inset-x-0 bottom-0 max-h-[80dvh] rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)] data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-open:slide-in-from-left data-closed:slide-out-to-left",
      right:
        "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-open:slide-in-from-right data-closed:slide-out-to-right",
      top: "inset-x-0 top-0 max-h-[80vh] border-b data-open:slide-in-from-top data-closed:slide-out-to-top",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type SheetContentVariants = VariantProps<typeof sheetContentVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { sheetContentVariants };
export type { SheetContentVariants };
