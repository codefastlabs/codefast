import type { HTMLAttributes, JSX } from 'react';

import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Container
 * -------------------------------------------------------------------------- */

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

function Container({ asChild, className, ...props }: ContainerProps): JSX.Element {
  const Component = asChild ? Slot : 'div';

  return <Component className={cn('container', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ContainerProps };
export { Container };
