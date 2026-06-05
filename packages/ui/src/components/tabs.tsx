import type { TabsListVariants } from "#/variants/tabs";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { Tabs as TabsPrimitive } from "radix-ui";

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
        "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground outline-hidden transition-[color,background-color,box-shadow] duration-150 ease-snappy group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:not-disabled:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 motion-reduce:transition-none motion-reduce:duration-0 dark:hover:text-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm dark:group-data-[variant=default]/tabs-list:data-active:bg-input/50",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 motion-reduce:after:transition-none group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
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
      className={cn(
        "flex-1 text-sm ring-ring/50 outline-ring focus-visible:ring-4 focus-visible:outline-1",
        className,
      )}
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
