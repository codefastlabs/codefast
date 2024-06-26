import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Pre
 * -------------------------------------------------------------------------- */

type PreElement = HTMLPreElement;

interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  asChild?: boolean;
}

const Pre = React.forwardRef<PreElement, PreProps>(({ asChild, ...props }, ref) => {
  const Component = asChild ? Slot : 'pre';

  return <Component ref={ref} {...props} />;
});

Pre.displayName = 'Pre';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Pre, type PreProps };
