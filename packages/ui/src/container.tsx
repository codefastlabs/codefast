import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Container
 * -------------------------------------------------------------------------- */

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return <Comp ref={ref} className={cn("container", className)} {...props} />;
});
Container.displayName = "Container";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Container };
