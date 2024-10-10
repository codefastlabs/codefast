import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type HTMLAttributes } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

type SectionElement = HTMLElement;

interface SectionProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Section = forwardRef<SectionElement, SectionProps>(
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
