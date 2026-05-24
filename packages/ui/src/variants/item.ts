import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Item
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const itemVariants = tv({
  base: [
    "group/item flex flex-wrap items-center",
    "rounded-lg border border-transparent outline-hidden",
    "text-sm",
    "transition-colors duration-100",
    "motion-reduce:transition-none motion-reduce:duration-0",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "[a]:transition-colors",
    "[a]:motion-reduce:transition-none",
    "[a]:hover:bg-accent/50",
  ],
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: ["gap-4", "p-4"],
      sm: ["gap-2.5", "px-4 py-3"],
    },
    variant: {
      default: "bg-transparent",
      muted: "bg-muted/50",
      outline: "border-border",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Variant: ItemMedia
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const itemMediaVariants = tv({
  base: [
    "flex shrink-0 items-center justify-center gap-2",
    "group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start",
    "[&_svg]:pointer-events-none",
  ],
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-transparent",
      icon: [
        "size-8 shrink-0",
        "rounded-md border",
        "bg-muted",
        "[&_svg:not([class*='size-'])]:size-4",
      ],
      image: [
        "size-10 shrink-0 overflow-hidden",
        "rounded-md",
        "[&_img]:size-full [&_img]:object-cover",
      ],
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type ItemVariants = VariantProps<typeof itemVariants>;

/**
 * @since 0.3.16-canary.0
 */
type ItemMediaVariants = VariantProps<typeof itemMediaVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { itemMediaVariants, itemVariants };
export type { ItemMediaVariants, ItemVariants };
