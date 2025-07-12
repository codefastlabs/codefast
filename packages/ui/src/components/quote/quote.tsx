"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

function Quote({
  asChild,
  ...props
}: ComponentProps<"q"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "q";

  return <Component data-slot="quote" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Quote };
