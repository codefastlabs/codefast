'use client';

import type { ComponentProps, JSX } from 'react';

import { Label } from '@/components/label';
import { cn } from '@codefast/tailwind-variants';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

type RadioCardsProps = ComponentProps<typeof RadioGroupPrimitive.Root>;

function RadioCards(props: RadioCardsProps): JSX.Element {
  return <RadioGroupPrimitive.Root data-slot="radio-cards" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

type RadioCardsItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

function RadioCardsItem({ children, className, ...props }: RadioCardsItemProps): JSX.Element {
  return (
    <Label
      className="border-input hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring flex items-start gap-3 rounded-lg border p-3 transition has-disabled:opacity-50"
      data-slot="radio-card"
    >
      <RadioGroupPrimitive.Item
        className={cn(
          'border-input text-primary-foreground focus-visible:not-aria-checked:border-ring focus-visible:ring-ring/50 focus-visible:aria-checked:ring-primary/20 dark:focus-visible:aria-checked:ring-primary/40 aria-checked:border-primary aria-checked:bg-primary dark:bg-input/30 peer flex size-4 shrink-0 items-center justify-center rounded-full border shadow-xs outline-hidden transition focus-visible:ring-3',
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
export type { RadioCardsItemProps, RadioCardsProps };
