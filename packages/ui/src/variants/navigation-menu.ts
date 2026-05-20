import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

import { buttonVariants } from "#/variants/button";

/* -----------------------------------------------------------------------------
 * Style: NavigationMenuTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const navigationMenuTriggerVariants = tv({
  base: buttonVariants({
    className:
      "data-open:bg-secondary/50 data-open:text-secondary-foreground group/navigation-menu-trigger focus-visible:bg-secondary dark:hover:not-disabled:bg-secondary",
    variant: "ghost",
  }),
});

/**
 * @since 0.3.16-canary.0
 */
type NavigationMenuTriggerVariants = VariantProps<typeof navigationMenuTriggerVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { navigationMenuTriggerVariants };
export type { NavigationMenuTriggerVariants };
