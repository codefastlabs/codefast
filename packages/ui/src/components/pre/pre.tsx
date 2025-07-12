"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Pre
 * -------------------------------------------------------------------------- */

interface PreProps extends ComponentProps<"pre"> {
  asChild?: boolean;
}

function Pre({ asChild, ...props }: PreProps): JSX.Element {
  const Component = asChild ? Slot : "pre";

  return <Component data-slot="pre" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Pre };
export type { PreProps };
