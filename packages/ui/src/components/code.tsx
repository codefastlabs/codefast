import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Code
 * -------------------------------------------------------------------------- */

interface CodeProps extends ComponentProps<'code'> {
  asChild?: boolean;
}

function Code({ asChild, ...props }: CodeProps): JSX.Element {
  const Component = asChild ? Slot : 'code';

  return <Component data-slot="code" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CodeProps };
export { Code };
