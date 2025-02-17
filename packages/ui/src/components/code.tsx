import type { HTMLAttributes, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Code
 * -------------------------------------------------------------------------- */

interface CodeProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

function Code({ asChild, ...props }: CodeProps): JSX.Element {
  const Component = asChild ? Slot : 'code';

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CodeProps };
export { Code };
