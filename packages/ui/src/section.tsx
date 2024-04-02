import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}
const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "section";

    return <Comp ref={ref} {...props} />;
  },
);
Section.displayName = "Section";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Section, type SectionProps };
