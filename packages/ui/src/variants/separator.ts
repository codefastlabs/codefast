import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const separatorVariants = tv({
  base: "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
  defaultVariants: {
    align: "center",
    orientation: "horizontal",
  },
  variants: {
    align: {
      center: "relative flex items-center justify-center",
      end: "relative flex items-center justify-end",
      start: "relative flex items-center justify-start",
    },
    orientation: {
      horizontal: "",
      vertical: "",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type SeparatorVariants = VariantProps<typeof separatorVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { separatorVariants };
export type { SeparatorVariants };
