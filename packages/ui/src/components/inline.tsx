"use client";

import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps, JSX } from "react";

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
