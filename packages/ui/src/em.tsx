import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

const Em = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "em";

  return <Comp ref={ref} {...props} />;
});
Em.displayName = "Em";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Em };
