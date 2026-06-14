import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const sheetContentVariants = tv({
  base: "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition ease-ui data-open:animate-in data-open:animation-duration-panel-in data-open:fade-in-0 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-panel-out data-closed:fade-out-0",
  defaultVariants: {
    side: "right",
  },
  variants: {
    side: {
      bottom: "inset-x-0 bottom-0 h-auto border-t data-open:slide-in-from-bottom-10 data-closed:slide-out-to-bottom-10",
      left: "inset-y-0 start-0 h-full w-3/4 border-e sm:max-w-sm data-open:slide-in-from-left-10 data-closed:slide-out-to-left-10",
      right:
        "inset-y-0 end-0 h-full w-3/4 border-s sm:max-w-sm data-open:slide-in-from-right-10 data-closed:slide-out-to-right-10",
      top: "inset-x-0 top-0 h-auto border-b data-open:slide-in-from-top-10 data-closed:slide-out-to-top-10",
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
