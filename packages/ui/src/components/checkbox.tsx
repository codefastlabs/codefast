import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

type CheckboxElement = ComponentRef<typeof CheckboxPrimitive.Root>;
type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

const Checkbox = forwardRef<CheckboxElement, CheckboxProps>(
  ({ className, ...props }, forwardedRef) => (
    <CheckboxPrimitive.Root
      ref={forwardedRef}
      className={cn(
        'peer',
        'border-input text-primary-foreground shadow-xs inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition',
        'hover:border-primary',
        'aria-checked:border-primary aria-checked:bg-primary',
        'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
        'disabled:cursor-default disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CheckboxProps };
export { Checkbox };
