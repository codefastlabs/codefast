"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

interface QuoteProps extends ComponentProps<"q"> {
  asChild?: boolean;
}

function Quote({ asChild, ...props }: QuoteProps): JSX.Element {
  const Component = asChild ? Slot : "q";

  return <Component data-slot="quote" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Quote };
export type { QuoteProps };
