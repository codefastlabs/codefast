"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import * as TabsPrimitive from "@radix-ui/react-tabs";

/* -----------------------------------------------------------------------------
 * Component: Tabs
 * -------------------------------------------------------------------------- */

type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;

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

type TabsListProps = ComponentProps<typeof TabsPrimitive.List>;

function TabsList({ className, ...props }: TabsListProps): JSX.Element {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 rounded-xl bg-muted px-1 py-1 text-muted-foreground",
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
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition outline-none hover:not-disabled:text-foreground focus-visible:ring-3 focus-visible:ring-ring-focus disabled:opacity-50 data-[state=active]:bg-muted-selected data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:outline-1 data-[state=active]:outline-ring-subtle [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
        "mt-2 rounded-xl ring-ring-focus outline-ring focus-visible:ring-4 focus-visible:outline-1",
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
