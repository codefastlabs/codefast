"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Text
 * -------------------------------------------------------------------------- */

interface TextProps extends ComponentProps<"p"> {
  asChild?: boolean;
}

function Text({ asChild, ...props }: TextProps): JSX.Element {
  const Component = asChild ? Slot : "p";

  return <Component data-slot="text" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Text };
export type { TextProps };
