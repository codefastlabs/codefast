import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Heading
 * -------------------------------------------------------------------------- */

function Heading({
  as: Tag = 'h1',
  asChild,
  ...props
}: ComponentProps<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : Tag;

  return <Component data-slot="heading" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Heading };
