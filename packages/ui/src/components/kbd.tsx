import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Kbd
 * -------------------------------------------------------------------------- */

type KbdElement = HTMLElement;

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const Kbd = React.forwardRef<KbdElement, KbdProps>(
  ({ asChild, className, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'kbd';

    return (
      <Component
        ref={forwardedRef}
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium',
          className,
        )}
        {...props}
      />
    );
  },
);

Kbd.displayName = 'Kbd';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Kbd, type KbdProps };
