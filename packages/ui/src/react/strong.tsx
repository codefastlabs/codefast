import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

type StrongElement = HTMLElement;

interface StrongProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Strong = React.forwardRef<StrongElement, StrongProps>(
  ({ asChild, ...props }, ref) => {
    const Component = asChild ? Slot : 'strong';

    return <Component ref={ref} {...props} />;
  },
);

Strong.displayName = 'Strong';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Strong, type StrongProps };
