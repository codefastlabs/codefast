import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Blockquote
 * -------------------------------------------------------------------------- */

const Blockquote = React.forwardRef<
  HTMLQuoteElement,
  React.BlockquoteHTMLAttributes<HTMLQuoteElement> & {
    asChild?: boolean;
  }
>(({ asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "blockquote";

  return <Comp ref={ref} {...props} />;
});
Blockquote.displayName = "Blockquote";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Blockquote };
