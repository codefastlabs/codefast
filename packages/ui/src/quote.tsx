import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

const Quote = React.forwardRef<
  HTMLQuoteElement,
  React.QuoteHTMLAttributes<HTMLQuoteElement> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "q";

  return <Comp ref={ref} {...props} />;
});
Quote.displayName = "Quote";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Quote };
