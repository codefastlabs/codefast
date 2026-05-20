import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: SidebarMenuButton
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const sidebarMenuButtonVariants = tv({
  base: [
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden p-2",
    "rounded-md ring-sidebar-ring outline-hidden",
    "text-left text-sm",
    "transition-[width,height,padding]",
    "group-has-data-[sidebar=menu-action]/menu-item:pr-8",
    "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "focus-visible:ring-3",
    "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground",
    "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground",
    "[&>span:last-child]:truncate",
    "[&>svg]:size-4 [&>svg]:shrink-0",
  ],
  defaultVariants: {
    size: "md",
    variant: "default",
  },
  variants: {
    size: {
      sm: ["h-7", "text-xs"],
      md: ["h-8", "text-sm"],
      lg: ["h-12 text-sm", "group-data-[collapsible=icon]:p-0!"],
    },
    variant: {
      default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      outline: [
        "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))]",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      ],
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type SidebarMenuButtonVariants = VariantProps<typeof sidebarMenuButtonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { sidebarMenuButtonVariants };
export type { SidebarMenuButtonVariants };
