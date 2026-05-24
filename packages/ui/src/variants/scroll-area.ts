import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const scrollAreaScrollbarVariants = tv({
  base: [
    "flex",
    "p-px",
    "touch-none transition-colors select-none",
    "motion-reduce:transition-none motion-reduce:duration-0",
  ],
  compoundVariants: [
    {
      className: "w-1.5",
      orientation: "vertical",
      size: "sm",
    },
    {
      className: "w-2",
      orientation: "vertical",
      size: "md",
    },
    {
      className: "w-2.5",
      orientation: "vertical",
      size: "lg",
    },
    {
      className: "h-1.5",
      orientation: "horizontal",
      size: "sm",
    },
    {
      className: "h-2",
      orientation: "horizontal",
      size: "md",
    },
    {
      className: "h-2.5",
      orientation: "horizontal",
      size: "lg",
    },
  ],
  defaultVariants: {
    orientation: "vertical",
    size: "md",
  },
  variants: {
    orientation: {
      horizontal: ["w-full flex-col", "border-t border-t-transparent"],
      vertical: ["h-full flex-row", "border-l border-l-transparent"],
    },
    size: {
      none: "",
      sm: "",
      md: "",
      lg: "",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type ScrollAreaScrollbarVariants = VariantProps<typeof scrollAreaScrollbarVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { scrollAreaScrollbarVariants };
export type { ScrollAreaScrollbarVariants };
