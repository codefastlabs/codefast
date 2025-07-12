"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

function Strong({
  asChild,
  ...props
}: ComponentProps<"strong"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "strong";

  return <Component data-slot="strong" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Strong };
