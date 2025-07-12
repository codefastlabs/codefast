"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

interface StrongProps extends ComponentProps<"strong"> {
  asChild?: boolean;
}

function Strong({ asChild, ...props }: StrongProps): JSX.Element {
  const Component = asChild ? Slot : "strong";

  return <Component data-slot="strong" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Strong };
export type { StrongProps };
