import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Marker
 * -------------------------------------------------------------------------- */

/**
 * Inline chat divider — plain label, centered separator rule, or bottom border.
 *
 * @since 0.5.0-canary.3
 */
const markerVariants = tv({
  base: "group/marker relative flex min-h-4 w-full items-center gap-2 text-start text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:underline-offset-3 [a]:hover:text-foreground",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "",
      separator:
        "before:me-1 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ms-1 after:h-px after:min-w-0 after:flex-1 after:bg-border",
      border: "border-b border-border pb-2",
    },
  },
});

/**
 * @since 0.5.0-canary.3
 */
type MarkerVariants = VariantProps<typeof markerVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { markerVariants };
export type { MarkerVariants };
