"use client";

import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Box
 * -------------------------------------------------------------------------- */

function Box({
  asChild,
  ...props
}: ComponentProps<"div"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "div";

  return <Component data-slot="box" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Box };
