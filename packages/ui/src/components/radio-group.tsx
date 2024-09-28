import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

type RadioGroupElement = React.ElementRef<typeof RadioGroupPrimitive.Root>;
type RadioGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

const RadioGroup = React.forwardRef<RadioGroupElement, RadioGroupProps>(({ className, ...props }, forwardedRef) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={forwardedRef} />;
});

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: RadioGroupItem
 * -------------------------------------------------------------------------- */

type RadioGroupItemElement = React.ElementRef<typeof RadioGroupPrimitive.Item>;
type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

const RadioGroupItem = React.forwardRef<RadioGroupItemElement, RadioGroupItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <RadioGroupPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'border-input text-foreground group peer aspect-square size-4 rounded-full border',
        'hover:border-primary',
        'aria-checked:border-primary',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="after:bg-primary relative flex size-full items-center justify-center after:block after:size-2.5 after:rounded-full" />
    </RadioGroupPrimitive.Item>
  ),
);

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioGroup, RadioGroupItem, type RadioGroupProps, type RadioGroupItemProps };
