import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const sheetContentVariants = tv({
  base: [
    "fixed z-50 flex flex-col overflow-auto",
    "bg-background shadow-lg",
    "ease-ui data-open:animate-in data-open:animation-duration-500",
    "data-closed:animate-out data-closed:animation-duration-500",
    "motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0",
  ],
  defaultVariants: {
    side: "right",
  },
  variants: {
    side: {
      bottom: [
        "max-h-[80dvh]",
        "inset-x-0 bottom-0",
        "rounded-t-2xl border-t",
        "pb-[env(safe-area-inset-bottom)]",
        "data-open:slide-in-from-bottom",
        "data-closed:slide-out-to-bottom",
      ],
      left: [
        "h-full w-3/4",
        "inset-y-0 left-0",
        "border-r",
        "sm:max-w-sm",
        "data-open:slide-in-from-left",
        "data-closed:slide-out-to-left",
      ],
      right: [
        "h-full w-3/4",
        "inset-y-0 right-0",
        "border-l",
        "sm:max-w-sm",
        "data-open:slide-in-from-right",
        "data-closed:slide-out-to-right",
      ],
      top: [
        "max-h-[80vh]",
        "inset-x-0 top-0",
        "border-b",
        "data-open:slide-in-from-top",
        "data-closed:slide-out-to-top",
      ],
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
