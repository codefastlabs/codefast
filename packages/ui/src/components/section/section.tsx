"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

interface SectionProps extends ComponentProps<"section"> {
  asChild?: boolean;
}

function Section({ asChild, ...props }: SectionProps): JSX.Element {
  const Component = asChild ? Slot : "section";

  return <Component data-slot="section" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Section };
export type { SectionProps };
