import type { JSX, QuoteHTMLAttributes } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

interface QuoteProps extends QuoteHTMLAttributes<HTMLQuoteElement> {
  asChild?: boolean;
}

function Quote({ asChild, ...props }: QuoteProps): JSX.Element {
  const Component = asChild ? Slot : 'q';

  return <Component {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { QuoteProps };
export { Quote };
