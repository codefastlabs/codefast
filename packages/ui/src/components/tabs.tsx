import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Tabs
 * -------------------------------------------------------------------------- */

type TabsProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;
const Tabs = TabsPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: TabsList
 * -------------------------------------------------------------------------- */

type TabsListElement = React.ComponentRef<typeof TabsPrimitive.List>;
type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

const TabsList = React.forwardRef<TabsListElement, TabsListProps>(
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

type TabsTriggerElement = React.ComponentRef<typeof TabsPrimitive.Trigger>;
type TabsTriggerProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
>;

const TabsTrigger = React.forwardRef<TabsTriggerElement, TabsTriggerProps>(
  ({ className, ...props }, forwardedRef) => (
    <TabsPrimitive.Trigger
      ref={forwardedRef}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium outline-transparent transition-all',
        'data-[state=active]:bg-background data-[state=active]:text-foreground',
        'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
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

type TabsContentElement = React.ComponentRef<typeof TabsPrimitive.Content>;
type TabsContentProps = React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
>;

const TabsContent = React.forwardRef<TabsContentElement, TabsContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <TabsPrimitive.Content
      ref={forwardedRef}
      className={cn(
        'mt-2 rounded-md',
        'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
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

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
};
