import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import type { TabsListVariants } from "#/variants/tabs";
import { tabsListVariants } from "#/variants/tabs";

/* -----------------------------------------------------------------------------
 * Component: Tabs
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Tabs({ className, orientation = "horizontal", ...props }: TabsProps): JSX.Element {
  return (
    <TabsPrimitive.Root
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      data-orientation={orientation}
      data-slot="tabs"
      orientation={orientation}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TabsList
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TabsListProps = ComponentProps<typeof TabsPrimitive.List> & TabsListVariants;

/**
 * @since 0.3.16-canary.0
 */
function TabsList({ className, variant = "default", ...props }: TabsListProps): JSX.Element {
  return (
    <TabsPrimitive.List
      className={tabsListVariants({ className, variant })}
      data-slot="tabs-list"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TabsTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function TabsTrigger({ className, ...props }: TabsTriggerProps): JSX.Element {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-1.25 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-end-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TabsContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TabsContentProps = ComponentProps<typeof TabsPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function TabsContent({ className, ...props }: TabsContentProps): JSX.Element {
  return (
    <TabsPrimitive.Content
      className={cn("flex-1 text-sm outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Tabs, TabsContent, TabsList, TabsTrigger };
export type { TabsContentProps, TabsListProps, TabsProps, TabsTriggerProps };
