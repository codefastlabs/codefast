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
        'shadow-xs group peer flex items-center justify-center rounded-md border p-4 transition',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:ring-ring/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:outline-none',
        'disabled:cursor-default disabled:opacity-50',
        'aria-checked:border-primary',
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
