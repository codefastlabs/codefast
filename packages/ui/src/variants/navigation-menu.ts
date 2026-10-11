import type { VariantProps } from "#lib/utils";
import { tv } from "#lib/utils";

// ── Style: NavigationMenuTrigger ─────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
const navigationMenuTriggerVariants = tv({
  base: "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all outline-none hover:bg-muted focus:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-muted/50 data-popup-open:hover:bg-muted data-open:bg-muted/50 data-open:hover:bg-muted data-open:focus:bg-muted",
});

/**
 * @since 0.3.16-canary.0
 */
type NavigationMenuTriggerVariants = VariantProps<typeof navigationMenuTriggerVariants>;

// ── Exports ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export { navigationMenuTriggerVariants };
export type { NavigationMenuTriggerVariants };
