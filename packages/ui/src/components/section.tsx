import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

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
