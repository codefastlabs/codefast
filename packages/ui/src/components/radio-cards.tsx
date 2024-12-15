import type { ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { forwardRef } from 'react';

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
        'group peer flex cursor-pointer items-center justify-center rounded-md border p-4 shadow-sm transition',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:ring-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2',
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

export type { RadioCardsItemProps, RadioCardsProps };
export { RadioCards, RadioCardsItem };
