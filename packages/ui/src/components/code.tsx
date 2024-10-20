import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type HTMLAttributes } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Code
 * -------------------------------------------------------------------------- */

type CodeElement = HTMLElement;

interface CodeProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Code = forwardRef<CodeElement, CodeProps>(({ asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : 'code';

  return <Component ref={forwardedRef} {...props} />;
});

Code.displayName = 'Code';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Code, type CodeProps };
