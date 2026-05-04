"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";

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
function Tabs({ className, ...props }: TabsProps): JSX.Element {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-2", className)}
      data-slot="tabs"
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
type TabsListProps = ComponentProps<typeof TabsPrimitive.List>;

/**
 * @since 0.3.16-canary.0
 */
function TabsList({ className, ...props }: TabsListProps): JSX.Element {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 px-1 py-1",
        "rounded-xl",
        "bg-muted text-muted-foreground",
        className,
      )}
      data-slot="tabs-list"
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
        "inline-flex items-center justify-center gap-1.5",
        "px-2 py-1.5",
        "rounded-lg",
        "text-sm font-medium whitespace-nowrap text-muted-foreground",
        "transition",
        "not-dark:outline-hidden",
        "hover:not-disabled:text-foreground",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:opacity-50",
        "dark:focus-visible:-outline-offset-1 dark:focus-visible:outline-ring",
        "data-active:bg-background data-active:text-foreground data-active:shadow-sm",
        "dark:data-active:bg-input/50",
        "dark:focus-visible:data-active:outline-1",
        "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
        "mt-2",
        "rounded-xl ring-ring/50 outline-ring",
        "focus-visible:ring-4 focus-visible:outline-1",
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
