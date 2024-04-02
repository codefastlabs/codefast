import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

interface QuoteProps extends React.QuoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}
const Quote = React.forwardRef<HTMLQuoteElement, QuoteProps>(
  ({ asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "q";

    return <Comp ref={ref} {...props} />;
  },
);
Quote.displayName = "Quote";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Quote, type QuoteProps };
