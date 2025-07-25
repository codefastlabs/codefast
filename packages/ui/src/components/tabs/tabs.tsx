"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";

/* -----------------------------------------------------------------------------
 * Component: Tabs
 * -------------------------------------------------------------------------- */

type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;

function Tabs({ ...props }: TabsProps): JSX.Element {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TabsList
 * -------------------------------------------------------------------------- */

type TabsListProps = ComponentProps<typeof TabsPrimitive.List>;

function TabsList({ className, ...props }: TabsListProps): JSX.Element {
  return (
    <TabsPrimitive.List
      className={cn(
        "bg-muted text-muted-foreground inline-flex items-center justify-center gap-1 rounded-xl px-1 py-1",
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

type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger>;

function TabsTrigger({ className, ...props }: TabsTriggerProps): JSX.Element {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:bg-input/50 text-muted-foreground focus-visible:ring-ring/50 focus-visible:ring-3 dark:outline-ring not-dark:outline-hidden data-[state=active]:text-foreground hover:not-disabled:text-foreground inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium transition disabled:opacity-50 data-[state=active]:shadow-sm dark:-outline-offset-1 dark:data-[state=active]:outline-1 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
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

type TabsContentProps = ComponentProps<typeof TabsPrimitive.Content>;

function TabsContent({ className, ...props }: TabsContentProps): JSX.Element {
  return (
    <TabsPrimitive.Content
      className={cn(
        "outline-ring ring-ring/50 mt-2 rounded-xl focus-visible:outline-1 focus-visible:ring-4",
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
