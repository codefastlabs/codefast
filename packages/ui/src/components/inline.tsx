"use client";

import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Inline
 * -------------------------------------------------------------------------- */

function Inline({
  asChild,
  ...props
}: ComponentProps<"span"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "span";

  return <Component data-slot="inline" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Inline };
