"use client";

import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Box
 * -------------------------------------------------------------------------- */

interface BoxProps extends ComponentProps<"div"> {
  asChild?: boolean;
}

function Box({ asChild, ...props }: BoxProps): JSX.Element {
  const Component = asChild ? Slot : "div";

  return <Component data-slot="box" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Box };
export type { BoxProps };
