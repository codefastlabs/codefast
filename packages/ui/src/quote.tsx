import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

type QuoteElement = HTMLQuoteElement;

interface QuoteProps extends React.QuoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}

const Quote = React.forwardRef<QuoteElement, QuoteProps>(({ asChild, ...props }, ref) => {
  const Component = asChild ? Slot : "q";

  return <Component ref={ref} {...props} />;
});

Quote.displayName = "Quote";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Quote, type QuoteProps };
