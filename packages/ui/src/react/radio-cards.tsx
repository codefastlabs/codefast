'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

type RadioCardsElement = React.ElementRef<typeof RadioGroupPrimitive.Root>;
type RadioCardsProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;

const RadioCards = React.forwardRef<RadioCardsElement, RadioCardsProps>(
  ({ className, ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Root
        className={cn('grid gap-2', className)}
        {...props}
        ref={ref}
      />
    );
  },
);

RadioCards.displayName = RadioGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

type RadioCardsItemElement = React.ElementRef<typeof RadioGroupPrimitive.Item>;
type RadioCardsItemProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
>;

const RadioCardsItem = React.forwardRef<
  RadioCardsItemElement,
  RadioCardsItemProps
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'text-foreground focus-visible:bg-primary/10 group peer flex cursor-default items-center justify-center rounded-md border p-4 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 aria-checked:outline aria-checked:outline-2',
        className,
      )}
      {...props}
    />
  );
});

RadioCardsItem.displayName = RadioGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  RadioCards,
  RadioCardsItem,
  type RadioCardsProps,
  type RadioCardsItemProps,
};