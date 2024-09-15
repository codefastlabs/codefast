'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { collapsibleVariants } from '@/styles/collapsible-variants';

/* -----------------------------------------------------------------------------
 * Variant: Collapsible
 * -------------------------------------------------------------------------- */

const { content } = collapsibleVariants();

/* -----------------------------------------------------------------------------
 * Component: Collapsible
 * -------------------------------------------------------------------------- */

type CollapsibleProps = React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>;
const Collapsible = CollapsiblePrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: CollapsibleTrigger
 * -------------------------------------------------------------------------- */

type CollapsibleTriggerProps = React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

/* -----------------------------------------------------------------------------
 * Component: CollapsibleContent
 * -------------------------------------------------------------------------- */

type CollapsibleContentElement = React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>;
type CollapsibleContentProps = React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>;

const CollapsibleContent = React.forwardRef<CollapsibleContentElement, CollapsibleContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <CollapsiblePrimitive.CollapsibleContent ref={forwardedRef} className={content({ className })} {...props} />
  ),
);

CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
  type CollapsibleContentProps,
};
