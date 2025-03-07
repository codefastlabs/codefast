import type { ComponentProps, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

/* -----------------------------------------------------------------------------
 * Component: Section
 * -------------------------------------------------------------------------- */

interface SectionProps extends ComponentProps<'section'> {
  asChild?: boolean;
}

function Section({ asChild, ...props }: SectionProps): JSX.Element {
  const Component = asChild ? Slot : 'section';

  return <Component data-slot="section" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { SectionProps };
export { Section };
