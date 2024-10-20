import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

type RadioCardsElement = ComponentRef<typeof RadioGroupPrimitive.Root>;
type RadioCardsProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

const RadioCards = forwardRef<RadioCardsElement, RadioCardsProps>(({ className, ...props }, forwardedRef) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={forwardedRef} />;
});

RadioCards.displayName = RadioGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

type RadioCardsItemElement = ComponentRef<typeof RadioGroupPrimitive.Item>;
type RadioCardsItemProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

const RadioCardsItem = forwardRef<RadioCardsItemElement, RadioCardsItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <RadioGroupPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'text-foreground group peer flex cursor-pointer items-center justify-center rounded-md border-2 p-4',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:cursor-default disabled:opacity-50',
        'aria-checked:border-primary',
        className,
      )}
      {...props}
    />
  ),
);

RadioCardsItem.displayName = RadioGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioCards, RadioCardsItem, type RadioCardsItemProps, type RadioCardsProps };
