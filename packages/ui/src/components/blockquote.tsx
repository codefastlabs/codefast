import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Blockquote
 * -------------------------------------------------------------------------- */

function Blockquote({
  asChild,
  ...props
}: ComponentProps<'blockquote'> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'blockquote';

  return <Component data-slot="blockquote" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Blockquote };
