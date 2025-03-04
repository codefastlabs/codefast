import type { ComponentProps, JSX } from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Tabs
 * -------------------------------------------------------------------------- */

type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;
const Tabs = TabsPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: TabsList
 * -------------------------------------------------------------------------- */

type TabsListProps = ComponentProps<typeof TabsPrimitive.List>;

function TabsList({ className, ...props }: TabsListProps): JSX.Element {
  return (
    <TabsPrimitive.List
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center gap-1 rounded-lg p-1',
        className,
      )}
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
        'data-[state=active]:bg-background data-[state=active]:text-foreground focus-visible:ring-ring focus-visible:ring-3 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium outline-transparent transition-all focus-visible:outline-none disabled:opacity-50 data-[state=active]:shadow-sm',
        className,
      )}
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
        'focus-visible:ring-ring focus-visible:ring-3 mt-2 rounded-lg focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { TabsContentProps, TabsListProps, TabsProps, TabsTriggerProps };
export { Tabs, TabsContent, TabsList, TabsTrigger };
