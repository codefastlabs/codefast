import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Box
 * -------------------------------------------------------------------------- */

interface BoxProps extends ComponentProps<'div'> {
  asChild?: boolean;
}

function Box({ asChild, ...props }: BoxProps): JSX.Element {
  const Component = asChild ? Slot : 'div';

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { BoxProps };
export { Box };
