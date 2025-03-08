import type { ComponentProps, JSX } from 'react';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

/* -----------------------------------------------------------------------------
 * Component: Collapsible
 * -------------------------------------------------------------------------- */

function Collapsible({ ...props }: ComponentProps<typeof CollapsiblePrimitive.Root>): JSX.Element {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleTrigger
 * -------------------------------------------------------------------------- */

function CollapsibleTrigger({ ...props }: ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>): JSX.Element {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CollapsibleContent
 * -------------------------------------------------------------------------- */

function CollapsibleContent({ ...props }: ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>): JSX.Element {
  return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
