import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

type CheckboxElement = React.ElementRef<typeof CheckboxPrimitive.Root>;
type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

const Checkbox = React.forwardRef<CheckboxElement, CheckboxProps>(({ className, ...props }, forwardedRef) => (
  <CheckboxPrimitive.Root
    ref={forwardedRef}
    className={cn(
      'border-input hover:border-primary aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground peer flex size-4 shrink-0 rounded-sm border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex size-full items-center justify-center text-current">
      <CheckIcon className="size-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Checkbox, type CheckboxProps };
