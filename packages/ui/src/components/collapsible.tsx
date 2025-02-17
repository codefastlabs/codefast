import type { ComponentProps, JSX } from 'react';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Collapsible
 * -------------------------------------------------------------------------- */

type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;
const Collapsible = CollapsiblePrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: CollapsibleTrigger
 * -------------------------------------------------------------------------- */

type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

/* -----------------------------------------------------------------------------
 * Component: CollapsibleContent
 * -------------------------------------------------------------------------- */

type CollapsibleContentProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>;

function CollapsibleContent({ className, ...props }: CollapsibleContentProps): JSX.Element {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      className={cn(
        'overflow-hidden',
        'data-[state=open]:animate-collapsible-open',
        'data-[state=closed]:animate-collapsible-closed',
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
