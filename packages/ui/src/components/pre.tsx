import { Slot } from '@radix-ui/react-slot';
import { type HTMLAttributes, forwardRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Pre
 * -------------------------------------------------------------------------- */

type PreElement = HTMLPreElement;
interface PreProps extends HTMLAttributes<HTMLPreElement> {
  asChild?: boolean;
}

const Pre = forwardRef<PreElement, PreProps>(({ asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : 'pre';

  return <Component ref={forwardedRef} {...props} />;
});

Pre.displayName = 'Pre';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Pre, type PreProps };
