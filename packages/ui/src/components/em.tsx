import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type HTMLAttributes } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

type EmElement = HTMLElement;
interface EmProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Em = forwardRef<EmElement, EmProps>(({ asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : 'em';

  return <Component ref={forwardedRef} {...props} />;
});

Em.displayName = 'Em';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Em, type EmProps };
