import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Container
 * -------------------------------------------------------------------------- */

type ContainerElement = HTMLDivElement;

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const Container = React.forwardRef<ContainerElement, ContainerProps>(({ className, asChild, ...props }, ref) => {
  const Component = asChild ? Slot : 'div';

  return <Component ref={ref} className={cn('container', className)} {...props} />;
});

Container.displayName = 'Container';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Container, type ContainerProps };
