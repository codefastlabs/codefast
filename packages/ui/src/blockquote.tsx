import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Blockquote
 * -------------------------------------------------------------------------- */

type BlockquoteElement = HTMLQuoteElement;

interface BlockquoteProps extends React.BlockquoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}

const Blockquote = React.forwardRef<BlockquoteElement, BlockquoteProps>(({ asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "blockquote";

  return <Comp ref={ref} {...props} />;
});

Blockquote.displayName = "Blockquote";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Blockquote, type BlockquoteProps };
