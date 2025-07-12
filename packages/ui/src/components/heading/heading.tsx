"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Heading
 * -------------------------------------------------------------------------- */

interface HeadingProps extends ComponentProps<"h1" | "h2" | "h3" | "h4" | "h5" | "h6"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  asChild?: boolean;
}

function Heading({ as: Tag = "h1", asChild, ...props }: HeadingProps): JSX.Element {
  const Component = asChild ? Slot : Tag;

  return <Component data-slot="heading" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Heading };
export type { HeadingProps };
