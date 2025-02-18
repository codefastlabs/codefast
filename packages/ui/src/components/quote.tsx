import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Quote
 * -------------------------------------------------------------------------- */

interface QuoteProps extends ComponentProps<'q'> {
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
