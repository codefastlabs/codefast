import type { ComponentProps, JSX } from 'react';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Collapsible
 * -------------------------------------------------------------------------- */

type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;

function Collapsible({ ...props }: CollapsibleProps): JSX.Element {
  return <CollapsiblePrimitive.Root {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleTrigger
 * -------------------------------------------------------------------------- */

type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>;

function CollapsibleTrigger({ ...props }: CollapsibleTriggerProps): JSX.Element {
  return <CollapsiblePrimitive.CollapsibleTrigger {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleContent
 * -------------------------------------------------------------------------- */

type CollapsibleContentProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>;

function CollapsibleContent({ className, ...props }: CollapsibleContentProps): JSX.Element {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      className={cn(
        'data-[state=open]:animate-collapsible-open data-[state=closed]:animate-collapsible-closed overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CollapsibleContentProps, CollapsibleProps, CollapsibleTriggerProps };
export { Collapsible, CollapsibleContent, CollapsibleTrigger };
