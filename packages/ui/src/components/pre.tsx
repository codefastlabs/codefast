import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Pre
 * -------------------------------------------------------------------------- */

function Pre({
  asChild,
  ...props
}: ComponentProps<'pre'> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'pre';

  return <Component data-slot="pre" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Pre };
