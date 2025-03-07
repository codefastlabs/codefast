import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Em
 * -------------------------------------------------------------------------- */

interface EmProps extends ComponentProps<'em'> {
  asChild?: boolean;
}

function Em({ asChild, ...props }: EmProps): JSX.Element {
  const Component = asChild ? Slot : 'em';

  return <Component data-slot="em" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { EmProps };
export { Em };
