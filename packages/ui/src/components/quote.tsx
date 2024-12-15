import type { QuoteHTMLAttributes } from 'react';

import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

type QuoteElement = HTMLQuoteElement;
interface QuoteProps extends QuoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}

const Quote = forwardRef<QuoteElement, QuoteProps>(({ asChild, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : 'q';

  return <Component ref={forwardedRef} {...props} />;
});

Quote.displayName = 'Quote';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { QuoteProps };
export { Quote };
