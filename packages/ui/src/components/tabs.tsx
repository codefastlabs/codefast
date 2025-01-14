import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Tabs
 * -------------------------------------------------------------------------- */

type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;
const Tabs = TabsPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: TabsList
 * -------------------------------------------------------------------------- */

type TabsListElement = ComponentRef<typeof TabsPrimitive.List>;
type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

const TabsList = forwardRef<TabsListElement, TabsListProps>(
  ({ className, ...props }, forwardedRef) => (
    <TabsPrimitive.List
      ref={forwardedRef}
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center gap-1 rounded-md p-1',
        className,
      )}
      {...props}
    />
  ),
);

TabsList.displayName = TabsPrimitive.List.displayName;

/* -----------------------------------------------------------------------------
 * Component: TabsTrigger
 * -------------------------------------------------------------------------- */

type TabsTriggerElement = ComponentRef<typeof TabsPrimitive.Trigger>;
type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

const TabsTrigger = forwardRef<TabsTriggerElement, TabsTriggerProps>(
  ({ className, ...props }, forwardedRef) => (
    <TabsPrimitive.Trigger
      ref={forwardedRef}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium outline-transparent transition-all',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: TabsContent
 * -------------------------------------------------------------------------- */

type TabsContentElement = ComponentRef<typeof TabsPrimitive.Content>;
type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

const TabsContent = forwardRef<TabsContentElement, TabsContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <TabsPrimitive.Content
      ref={forwardedRef}
      className={cn(
        'mt-2 rounded-md',
        'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  ),
);

TabsContent.displayName = TabsPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { TabsContentProps, TabsListProps, TabsProps, TabsTriggerProps };
export { Tabs, TabsContent, TabsList, TabsTrigger };
