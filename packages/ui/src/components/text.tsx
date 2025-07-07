"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Text
 * -------------------------------------------------------------------------- */

function Text({
  asChild,
  ...props
}: ComponentProps<"p"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "p";

  return <Component data-slot="text" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Text };
