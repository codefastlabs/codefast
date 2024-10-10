import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

type StrongElement = HTMLElement;

interface StrongProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Strong = React.forwardRef<StrongElement, StrongProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'strong';

    return <Component ref={forwardedRef} {...props} />;
  },
);

Strong.displayName = 'Strong';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Strong, type StrongProps };
