import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Style: NavigationMenuTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const navigationMenuTriggerVariants = tv({
  base: "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted",
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
