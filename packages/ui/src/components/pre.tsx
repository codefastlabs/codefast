import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Pre
 * -------------------------------------------------------------------------- */

interface PreProps extends ComponentProps<'pre'> {
  asChild?: boolean;
}

function Pre({ asChild, ...props }: PreProps): JSX.Element {
  const Component = asChild ? Slot : 'pre';

  return <Component data-slot="pre" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { PreProps };
export { Pre };
