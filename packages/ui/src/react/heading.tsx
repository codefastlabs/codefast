import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Heading
 * -------------------------------------------------------------------------- */

type HeadingElement = HTMLHeadingElement;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  asChild?: boolean;
}

const Heading = React.forwardRef<HeadingElement, HeadingProps>(
  ({ asChild, as: Tag = 'h1', ...props }, ref) => {
    const Component = asChild ? Slot : Tag;

    return <Component ref={ref} {...props} />;
  },
);

Heading.displayName = 'Heading';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Heading, type HeadingProps };
