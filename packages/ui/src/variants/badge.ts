import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Badge
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const badgeVariants = tv({
  base: [
    "inline-flex w-fit shrink-0 items-center justify-center gap-2 px-1.5 py-0.5",
    "rounded-md border outline-hidden",
    "text-xs font-medium whitespace-nowrap",
    "transition",
    "focus-visible:ring-3 focus-visible:ring-ring/50",
    "[&>svg]:size-3 [&>svg]:shrink-0",
  ],
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: [
        "border-transparent",
        "bg-primary text-primary-foreground",
        "focus-visible:ring-primary/20",
        "dark:focus-visible:ring-primary/40",
        "[a&]:hover:bg-primary/80",
      ],
      destructive: [
        "border-transparent",
        "bg-destructive text-white",
        "focus-visible:ring-destructive/20",
        "dark:bg-destructive/60",
        "dark:focus-visible:ring-destructive/40",
        "[a&]:hover:bg-destructive/90",
      ],
      outline: [
        "border-input",
        "bg-background",
        "focus-visible:border-ring",
        "[a&]:hover:border-ring/60 [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      ],
      secondary: [
        "border-transparent",
        "bg-secondary text-secondary-foreground",
        "[a&]:hover:bg-secondary/80",
      ],
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type BadgeVariants = VariantProps<typeof badgeVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { badgeVariants };
export type { BadgeVariants };
