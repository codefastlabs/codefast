import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Container
 * -------------------------------------------------------------------------- */

type ContainerElement = HTMLDivElement;

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const Container = React.forwardRef<ContainerElement, ContainerProps>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return <Comp ref={ref} className={cn("container", className)} {...props} />;
});

Container.displayName = "Container";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Container, type ContainerProps };
