import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const separatorVariants = tv({
  base: "relative flex shrink-0 items-center bg-border",
  defaultVariants: {
    align: "center",
    orientation: "horizontal",
  },
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
