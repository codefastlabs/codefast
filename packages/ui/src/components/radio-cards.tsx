import type { ComponentProps, JSX } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { Label } from '@/components/label';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

function RadioCards(props: ComponentProps<typeof RadioGroupPrimitive.Root>): JSX.Element {
  return <RadioGroupPrimitive.Root data-slot="radio-cards" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

function RadioCardsItem({
  className,
  children,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>): JSX.Element {
  return (
    <Label
      className={cn(
        'border-input flex items-start gap-3 rounded-lg border p-3 transition',
        'hover:not-has-disabled:not-has-aria-checked:bg-secondary',
        'has-aria-checked:bg-primary/10 has-aria-checked:border-primary',
        'has-focus-visible:border-ring',
        'has-disabled:opacity-50',
      )}
      data-slot="radio-card"
    >
      <RadioGroupPrimitive.Item
        className={cn(
          'border-input text-primary-foreground shadow-xs outline-hidden peer flex size-4 shrink-0 items-center justify-center rounded-full border transition',
          'focus-visible:not-aria-checked:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
          'focus-visible:aria-checked:ring-primary/20',
          'aria-checked:border-primary aria-checked:bg-primary aria-checked:shadow-primary/50',
          className,
        )}
        data-slot="radio-card-item"
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="bg-background size-1 rounded-full" data-slot="radio-card-indicator" />
      </RadioGroupPrimitive.Item>
      {children}
    </Label>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioCards, RadioCardsItem };
