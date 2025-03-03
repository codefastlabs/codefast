import type { ComponentProps, JSX } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

type RadioCardsProps = ComponentProps<typeof RadioGroupPrimitive.Root>;

function RadioCards({ className, ...props }: RadioCardsProps): JSX.Element {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

type RadioCardsItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

function RadioCardsItem({ className, ...props }: RadioCardsItemProps): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'border-accent hover:not-disabled:bg-accent focus-visible:ring-ring focus-visible:border-ring focus-visible:ring-3 aria-checked:border-primary group peer flex items-center justify-center rounded-lg border-2 p-4 transition focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { RadioCardsItemProps, RadioCardsProps };
export { RadioCards, RadioCardsItem };
