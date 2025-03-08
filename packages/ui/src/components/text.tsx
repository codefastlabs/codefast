import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Text
 * -------------------------------------------------------------------------- */

function Text({
  asChild,
  ...props
}: ComponentProps<'p'> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'p';

  return <Component data-slot="text" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Text };
