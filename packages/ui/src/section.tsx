import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

const Section = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    asChild?: boolean;
  }
>(({ asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "section";

  return <Comp ref={ref} {...props} />;
});
Section.displayName = "Section";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Section };
