"use client";

import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

function Section({
  asChild,
  ...props
}: ComponentProps<"section"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "section";

  return <Component data-slot="section" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Section };
