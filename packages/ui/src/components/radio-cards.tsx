"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
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
      className={cn(
        "flex items-start gap-3",
        "rounded-lg border border-field-border p-3",
        "transition",
        "hover:not-has-disabled:not-has-aria-checked:bg-secondary-hover",
        "has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring-focus",
        "has-disabled:opacity-50",
        "has-aria-checked:border-primary has-aria-checked:bg-primary/10",
      )}
      data-slot="radio-card"
    >
      <RadioGroupPrimitive.Item
        className={cn(
          "peer flex size-4 shrink-0 items-center justify-center",
          "rounded-full border border-field-border bg-field shadow-xs",
          "text-primary-foreground",
          "outline-hidden transition",
          "focus-visible:ring-3 focus-visible:ring-ring-focus focus-visible:not-aria-checked:border-ring",
          "aria-checked:border-primary aria-checked:bg-primary focus-visible:aria-checked:ring-ring-focus",
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
