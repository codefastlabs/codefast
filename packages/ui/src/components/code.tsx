import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

/* -----------------------------------------------------------------------------
 * Component: Code
 * -------------------------------------------------------------------------- */

type CodeElement = HTMLElement;

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Code = React.forwardRef<CodeElement, CodeProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'code';

    return <Component ref={forwardedRef} {...props} />;
  },
);

Code.displayName = 'Code';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Code, type CodeProps };
