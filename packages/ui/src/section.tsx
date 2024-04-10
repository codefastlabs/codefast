import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

type SectionElement = HTMLElement;

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Section = React.forwardRef<SectionElement, SectionProps>(({ asChild, ...props }, ref) => {
  const Component = asChild ? Slot : "section";

  return <Component ref={ref} {...props} />;
});

Section.displayName = "Section";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Section, type SectionProps };
