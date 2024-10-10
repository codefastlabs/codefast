import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

type QuoteElement = HTMLQuoteElement;

interface QuoteProps extends React.QuoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}

const Quote = React.forwardRef<QuoteElement, QuoteProps>(
  ({ asChild, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'q';

    return <Component ref={forwardedRef} {...props} />;
  },
);

Quote.displayName = 'Quote';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Quote, type QuoteProps };
