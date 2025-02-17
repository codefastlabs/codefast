import type { BlockquoteHTMLAttributes, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Blockquote
 * -------------------------------------------------------------------------- */

interface BlockquoteProps extends BlockquoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}

function Blockquote({ asChild, ...props }: BlockquoteProps): JSX.Element {
  const Component = asChild ? Slot : 'blockquote';

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { BlockquoteProps };
export { Blockquote };
