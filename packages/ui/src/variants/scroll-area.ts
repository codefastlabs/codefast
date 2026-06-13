import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const scrollAreaScrollbarVariants = tv({
  base: "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-s data-vertical:border-s-transparent",
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
      horizontal: "",
      vertical: "",
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
