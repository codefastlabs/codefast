import { Slot } from '@radix-ui/react-slot';
import { type HTMLAttributes, forwardRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

type StrongElement = HTMLElement;

interface StrongProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Strong = forwardRef<StrongElement, StrongProps>(({ asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : 'strong';

  return <Component ref={forwardedRef} {...props} />;
});

Strong.displayName = 'Strong';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Strong, type StrongProps };
