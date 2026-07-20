import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Item
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const itemVariants = tv({
  base: "group/item flex w-full flex-wrap items-center rounded-lg border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-muted",
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  variants: {
    size: {
      default: "gap-2.5 px-3 py-2.5",
      sm: "gap-2.5 px-3 py-2.5",
      xs: "gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0",
    },
    variant: {
      default: "border-transparent",
      muted: "border-transparent bg-muted/50",
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
  base: "flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-transparent",
      icon: "[&_svg:not([class*='size-'])]:size-4",
      image:
        "size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover",
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
