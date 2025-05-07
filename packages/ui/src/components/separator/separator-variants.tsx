import { tv } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

const separatorVariants = tv({
  base: "bg-border relative flex shrink-0 items-center",
  variants: {
    align: {
      center: "justify-center",
      end: "justify-end",
      start: "justify-start",
    },
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px flex-col",
    },
  },
  defaultVariants: {
    align: "center",
    orientation: "horizontal",
  },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { separatorVariants };
