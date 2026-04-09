"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#utils/tv";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { Label } from "#components/label";

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
      className="flex items-start gap-3 rounded-lg border border-input p-3 transition hover:not-has-disabled:not-has-aria-checked:bg-secondary has-focus-visible:border-ring has-disabled:opacity-50 has-aria-checked:border-primary has-aria-checked:bg-primary/10"
      data-slot="radio-card"
    >
      <RadioGroupPrimitive.Item
        className={cn(
          "peer flex size-4 shrink-0 items-center justify-center rounded-full border border-input text-primary-foreground shadow-xs outline-hidden transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:not-aria-checked:border-ring aria-checked:border-primary aria-checked:bg-primary focus-visible:aria-checked:ring-primary/20 dark:bg-input/30 dark:focus-visible:aria-checked:ring-primary/40",
          className,
        )}
        data-slot="radio-card-item"
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          className="size-1 rounded-full bg-background"
          data-slot="radio-card-indicator"
        />
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
