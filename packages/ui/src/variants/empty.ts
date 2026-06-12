import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: EmptyMedia
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const emptyMediaVariants = tv({
  base: "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type EmptyMediaVariants = VariantProps<typeof emptyMediaVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { emptyMediaVariants };
export type { EmptyMediaVariants };
