import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

function Em({
  asChild,
  ...props
}: ComponentProps<"em"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "em";

  return <Component data-slot="em" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Em };
