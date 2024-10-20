import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

type RadioGroupElement = ComponentRef<typeof RadioGroupPrimitive.Root>;
type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

const RadioGroup = forwardRef<RadioGroupElement, RadioGroupProps>(({ className, ...props }, forwardedRef) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={forwardedRef} />;
});

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
        'border-input text-foreground group peer aspect-square size-4 rounded-full border shadow-sm transition',
        'hover:border-primary',
        'aria-checked:border-primary aria-checked:bg-primary',
        'focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className={cn(
          'relative flex size-full items-center justify-center',
          'after:bg-background after:block after:size-1 after:rounded-full',
        )}
      />
    </RadioGroupPrimitive.Item>
  ),
);

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioGroup, RadioGroupItem, type RadioGroupItemProps, type RadioGroupProps };
