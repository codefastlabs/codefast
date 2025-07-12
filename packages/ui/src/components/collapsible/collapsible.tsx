"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Collapsible
 * -------------------------------------------------------------------------- */

type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;

function Collapsible({ ...props }: CollapsibleProps): JSX.Element {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleTrigger
 * -------------------------------------------------------------------------- */

type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>;

function CollapsibleTrigger({ ...props }: CollapsibleTriggerProps): JSX.Element {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleContent
 * -------------------------------------------------------------------------- */

type CollapsibleContentProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>;

function CollapsibleContent({ ...props }: CollapsibleContentProps): JSX.Element {
  return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps };
