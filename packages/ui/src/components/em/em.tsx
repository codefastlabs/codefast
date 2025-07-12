"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

interface EmProps extends ComponentProps<"em"> {
  asChild?: boolean;
}

function Em({ asChild, ...props }: EmProps): JSX.Element {
  const Component = asChild ? Slot : "em";

  return <Component data-slot="em" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Em };
export type { EmProps };
