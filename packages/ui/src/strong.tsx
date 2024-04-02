import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

interface StrongProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}
const Strong = React.forwardRef<HTMLElement, StrongProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "strong";

    return <Comp ref={ref} {...props} />;
  },
);
Strong.displayName = "Strong";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Strong, type StrongProps };
