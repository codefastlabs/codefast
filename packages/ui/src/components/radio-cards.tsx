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
      className="hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-input-focus has-disabled:opacity-50 border-input group/radio-card flex items-start gap-3 rounded-lg border p-3 transition"
      data-slot="radio-card"
    >
      <RadioGroupPrimitive.Item
        className={cn(
          'border-input aria-checked:focus-visible:ring-3 aria-checked:focus-visible:ring-primary/20 text-primary-foreground group-hover/radio-card:not-disabled:not-aria-checked:border-input-hover aria-checked:border-primary aria-checked:bg-primary outline-hidden peer flex size-4 shrink-0 items-center justify-center rounded-full border transition',
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
