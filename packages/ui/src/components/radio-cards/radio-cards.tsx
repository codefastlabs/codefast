"use client";

import type { ComponentProps, JSX } from "react";

import { Label } from "@/components/label/label";
import { cn } from "@/lib/utils";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

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
      className="border-input hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring has-disabled:opacity-50 flex items-start gap-3 rounded-lg border p-3 transition"
      data-slot="radio-card"
    >
      <RadioGroupPrimitive.Item
        className={cn(
          "border-input text-primary-foreground shadow-xs outline-hidden focus-visible:not-aria-checked:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:aria-checked:ring-primary/20 dark:focus-visible:aria-checked:ring-primary/40 aria-checked:border-primary aria-checked:bg-primary dark:bg-input/30 peer flex size-4 shrink-0 items-center justify-center rounded-full border transition",
          className,
        )}
        data-slot="radio-card-item"
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          className="bg-background size-1 rounded-full"
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
