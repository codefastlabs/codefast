import type { BlockquoteHTMLAttributes } from 'react';

import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Blockquote
 * -------------------------------------------------------------------------- */

type BlockquoteElement = HTMLQuoteElement;
interface BlockquoteProps extends BlockquoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}

const Blockquote = forwardRef<BlockquoteElement, BlockquoteProps>(({ asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : 'blockquote';

  return <Component ref={forwardedRef} {...props} />;
});

Blockquote.displayName = 'Blockquote';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { BlockquoteProps };
export { Blockquote };
