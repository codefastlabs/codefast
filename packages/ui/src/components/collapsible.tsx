"use client";

import type { ComponentProps, JSX } from "react";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

/* -----------------------------------------------------------------------------
 * Component: Collapsible
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Collapsible({ ...props }: CollapsibleProps): JSX.Element {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>;

/**
 * @since 0.3.16-canary.0
 */
function CollapsibleTrigger({ ...props }: CollapsibleTriggerProps): JSX.Element {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CollapsibleContentProps = ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>;

/**
 * @since 0.3.16-canary.0
 */
function CollapsibleContent({ ...props }: CollapsibleContentProps): JSX.Element {
  return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
export type { CollapsibleContentProps, CollapsibleProps, CollapsibleTriggerProps };
