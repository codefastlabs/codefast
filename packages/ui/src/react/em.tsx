import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

type EmElement = HTMLElement;

interface EmProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Em = React.forwardRef<EmElement, EmProps>(({ asChild, ...props }, ref) => {
  const Component = asChild ? Slot : "em";

  return <Component ref={ref} {...props} />;
});

Em.displayName = "Em";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Em, type EmProps };
