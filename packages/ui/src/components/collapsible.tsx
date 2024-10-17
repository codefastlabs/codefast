import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Collapsible
 * -------------------------------------------------------------------------- */

type CollapsibleProps = ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Root
>;
const Collapsible = CollapsiblePrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: CollapsibleTrigger
 * -------------------------------------------------------------------------- */

type CollapsibleTriggerProps = ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.CollapsibleTrigger
>;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

/* -----------------------------------------------------------------------------
 * Component: CollapsibleContent
 * -------------------------------------------------------------------------- */

type CollapsibleContentElement = ComponentRef<
  typeof CollapsiblePrimitive.CollapsibleContent
>;
type CollapsibleContentProps = ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.CollapsibleContent
>;

const CollapsibleContent = forwardRef<
  CollapsibleContentElement,
  CollapsibleContentProps
>(({ className, ...props }, forwardedRef) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={forwardedRef}
    className={cn(
      'overflow-hidden',
      'data-[state=open]:animate-collapsible-open',
      'data-[state=closed]:animate-collapsible-closed',
      className,
    )}
    {...props}
  />
));

CollapsibleContent.displayName =
  CollapsiblePrimitive.CollapsibleContent.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  type CollapsibleContentProps,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
};
