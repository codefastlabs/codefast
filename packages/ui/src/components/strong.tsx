import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

function Strong({
  asChild,
  ...props
}: ComponentProps<"strong"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "strong";

  return <Component data-slot="strong" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Strong };
