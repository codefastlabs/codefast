import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

interface EmProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}
const Em = React.forwardRef<HTMLElement, EmProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "em";

    return <Comp ref={ref} {...props} />;
  },
);
Em.displayName = "Em";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Em, type EmProps };
