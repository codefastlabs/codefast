import { Slot } from '@radix-ui/react-slot';
import { type HTMLAttributes, forwardRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Heading
 * -------------------------------------------------------------------------- */

type HeadingElement = HTMLHeadingElement;

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  asChild?: boolean;
}

const Heading = forwardRef<HeadingElement, HeadingProps>(({ as: Tag = 'h1', asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : Tag;

  return <Component ref={forwardedRef} {...props} />;
});

Heading.displayName = 'Heading';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Heading, type HeadingProps };
