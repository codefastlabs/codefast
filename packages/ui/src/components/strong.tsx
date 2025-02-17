import type { HTMLAttributes, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

interface StrongProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

function Strong({ asChild, ...props }: StrongProps): JSX.Element {
  const Component = asChild ? Slot : 'strong';

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { StrongProps };
export { Strong };
