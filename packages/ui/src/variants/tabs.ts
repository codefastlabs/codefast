import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: TabsList
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const tabsListVariants = tv({
  base: "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-0.75 text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-muted",
      line: "gap-1 bg-transparent",
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type TabsListVariants = VariantProps<typeof tabsListVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { tabsListVariants };
export type { TabsListVariants };
