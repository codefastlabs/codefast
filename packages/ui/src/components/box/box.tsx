"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

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
