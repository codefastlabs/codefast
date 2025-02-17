import type { HTMLAttributes, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

interface EmProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

function Em({ asChild, ...props }: EmProps): JSX.Element {
  const Component = asChild ? Slot : 'em';

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { EmProps };
export { Em };
