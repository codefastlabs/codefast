import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Label
 * -------------------------------------------------------------------------- */

type LabelElement = React.ComponentRef<typeof LabelPrimitive.Root>;
type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

const Label = React.forwardRef<LabelElement, LabelProps>(
  ({ className, ...props }, forwardedRef) => (
    <LabelPrimitive.Root
      ref={forwardedRef}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:pointer-events-none peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  ),
);

Label.displayName = LabelPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Label, type LabelProps };
