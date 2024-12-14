import { Slot } from '@radix-ui/react-slot';
import { type HTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Container
 * -------------------------------------------------------------------------- */

type ContainerElement = HTMLDivElement;
interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const Container = forwardRef<ContainerElement, ContainerProps>(({ asChild, className, ...props }, forwardedRef) => {
  const Component = asChild ? Slot : 'div';

  return <Component ref={forwardedRef} className={cn('container', className)} {...props} />;
});

Container.displayName = 'Container';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Container, type ContainerProps };
