import { tv } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

const scrollAreaScrollbarVariants = tv({
  base: "flex touch-none select-none p-px transition-colors",
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
  variants: {
    orientation: {
      horizontal: "w-full flex-col border-t border-t-transparent",
      vertical: "h-full flex-row border-l border-l-transparent",
    },
    size: {
      none: "",
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: {
    size: "md",
    vertical: "vertical",
  },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { scrollAreaScrollbarVariants };
