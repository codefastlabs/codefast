import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Code
 * -------------------------------------------------------------------------- */

function Code({
  asChild,
  ...props
}: ComponentProps<'code'> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'code';

  return <Component data-slot="code" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Code };
