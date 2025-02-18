import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Strong
 * -------------------------------------------------------------------------- */

interface StrongProps extends ComponentProps<'strong'> {
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
