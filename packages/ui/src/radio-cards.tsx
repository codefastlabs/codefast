"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

type RadioCardsElement = React.ElementRef<typeof RadioGroupPrimitive.Root>;
type RadioCardsProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

const RadioCards = React.forwardRef<RadioCardsElement, RadioCardsProps>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />;
});

RadioCards.displayName = RadioGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

type RadioCardsItemElement = React.ElementRef<typeof RadioGroupPrimitive.Item>;
type RadioCardsItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

const RadioCardsItem = React.forwardRef<RadioCardsItemElement, RadioCardsItemProps>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "border-compound/70 text-compound-foreground group peer flex cursor-default items-center justify-center rounded-md border p-4",
        "hover:border-compound",
        "aria-checked:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:bg-primary/10 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
});

RadioCardsItem.displayName = RadioGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioCards, RadioCardsItem, type RadioCardsProps, type RadioCardsItemProps };
