"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Inline
 * -------------------------------------------------------------------------- */

interface InlineProps extends ComponentProps<"span"> {
  asChild?: boolean;
}

function Inline({ asChild, ...props }: InlineProps): JSX.Element {
  const Component = asChild ? Slot : "span";

  return <Component data-slot="inline" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Inline };
export type { InlineProps };
