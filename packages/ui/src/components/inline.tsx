import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Inline
 * -------------------------------------------------------------------------- */

interface InlineProps extends ComponentProps<'span'> {
  asChild?: boolean;
}

function Inline({ asChild, ...props }: InlineProps): JSX.Element {
  const Component = asChild ? Slot : 'span';

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { InlineProps };
export { Inline };
