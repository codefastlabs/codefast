import type { ComponentProps, JSX } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

function RadioCards({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>): JSX.Element {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} data-slot="radio-cards" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

function RadioCardsItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'border-secondary hover:not-disabled:bg-secondary focus-visible:ring-ring focus-visible:border-ring focus-visible:ring-3 aria-checked:border-primary outline-hidden group peer flex items-center justify-center rounded-lg border-2 p-4 disabled:opacity-50',
        className,
      )}
      data-slot="radio-card"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioCards, RadioCardsItem };
