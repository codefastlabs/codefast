import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Pre
 * -------------------------------------------------------------------------- */

const Pre = React.forwardRef<
  HTMLPreElement,
  React.HTMLAttributes<HTMLPreElement> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "pre";

  return <Comp ref={ref} {...props} />;
});
Pre.displayName = "Pre";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Pre };
