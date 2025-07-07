"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Pre
 * -------------------------------------------------------------------------- */

function Pre({
  asChild,
  ...props
}: ComponentProps<"pre"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "pre";

  return <Component data-slot="pre" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Pre };
