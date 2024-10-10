import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

type SectionElement = HTMLElement;

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Section = React.forwardRef<SectionElement, SectionProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'section';

    return <Component ref={forwardedRef} {...props} />;
  },
);

Section.displayName = 'Section';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Section, type SectionProps };
