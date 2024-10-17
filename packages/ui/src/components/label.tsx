import * as LabelPrimitive from '@radix-ui/react-label';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Label
 * -------------------------------------------------------------------------- */

type LabelElement = ComponentRef<typeof LabelPrimitive.Root>;
type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

const Label = forwardRef<LabelElement, LabelProps>(
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
