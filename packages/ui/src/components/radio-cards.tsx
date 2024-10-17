import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

type RadioCardsElement = ComponentRef<typeof RadioGroupPrimitive.Root>;
type RadioCardsProps = ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;

const RadioCards = forwardRef<RadioCardsElement, RadioCardsProps>(
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

RadioCards.displayName = RadioGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

type RadioCardsItemElement = ComponentRef<typeof RadioGroupPrimitive.Item>;
type RadioCardsItemProps = ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
>;

const RadioCardsItem = forwardRef<RadioCardsItemElement, RadioCardsItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <RadioGroupPrimitive.Item
      ref={forwardedRef}
      className={cn(
        'text-foreground group peer flex cursor-pointer items-center justify-center rounded-md border p-4',
        'focus-visible:bg-primary/10 focus-visible:outline focus-visible:outline-2',
        'disabled:cursor-default disabled:opacity-50',
        'aria-checked:outline aria-checked:outline-2',
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

export {
  RadioCards,
  RadioCardsItem,
  type RadioCardsItemProps,
  type RadioCardsProps,
};
