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
        'group peer flex items-center justify-center rounded-md border p-4 transition',
        'hover:not-disabled:not-aria-checked:border-input-hover',
        'focus-visible:ring-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:outline-none',
        'aria-checked:border-primary',
        'disabled:opacity-50',
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
