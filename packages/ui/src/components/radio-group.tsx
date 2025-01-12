import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

type RadioGroupElement = ComponentRef<typeof RadioGroupPrimitive.Root>;
type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

const RadioGroup = forwardRef<RadioGroupElement, RadioGroupProps>(
  ({ className, ...props }, forwardedRef) => {
    return (
      <RadioGroupPrimitive.Root
        className={cn('grid gap-2', className)}
        {...props}
        ref={forwardedRef}
      />
    );
  },
);

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: RadioGroupItem
 * -------------------------------------------------------------------------- */

type RadioGroupItemElement = ComponentRef<typeof RadioGroupPrimitive.Item>;
type RadioGroupItemProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

const RadioGroupItem = forwardRef<RadioGroupItemElement, RadioGroupItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <RadioGroupPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'peer',
        'border-input shadow-xs inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition',
        'hover:border-primary',
        'aria-checked:border-primary aria-checked:bg-primary',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="bg-background size-1 rounded-full" />
    </RadioGroupPrimitive.Item>
  ),
);

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { RadioGroupItemProps, RadioGroupProps };
export { RadioGroup, RadioGroupItem };
