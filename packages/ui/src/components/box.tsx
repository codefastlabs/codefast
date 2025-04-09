import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Box
 * -------------------------------------------------------------------------- */

function Box({
  asChild,
  ...props
}: ComponentProps<"div"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "div";

  return <Component data-slot="box" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Box };
