"use client";

import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import * as CheckboxGroupPrimitive from "./checkbox-group.primitive";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

type CheckboxCardsElement = React.ElementRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxCardsProps = React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Root>;

const CheckboxCards = React.forwardRef<CheckboxCardsElement, CheckboxCardsProps>(({ className, ...props }, ref) => {
  return <CheckboxGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />;
});

CheckboxCards.displayName = CheckboxGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

type CheckboxCardsItemElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>;

interface CheckboxCardsItemProps extends React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item> {
  checkboxClassName?: string;
}

const CheckboxCardsItem = React.forwardRef<CheckboxCardsItemElement, CheckboxCardsItemProps>(
  ({ className, children, checkboxClassName, ...props }, ref) => {
    return (
      <label
        className={cn(
          "border-compound/70 flex items-center justify-center gap-4 rounded-md border p-4",
          "hover:border-compound",
          className,
        )}
      >
        {children}
        <CheckboxGroupPrimitive.Item
          ref={ref}
          className={cn(
            "border-compound/70 peer size-4 shrink-0 cursor-default rounded-sm border shadow",
            "aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            checkboxClassName,
          )}
          {...props}
        >
          <CheckboxGroupPrimitive.CheckboxGroupIndicator className="flex size-full items-center justify-center text-current">
            <CheckIcon className="size-3.5" />
          </CheckboxGroupPrimitive.CheckboxGroupIndicator>
        </CheckboxGroupPrimitive.Item>
      </label>
    );
  },
);

CheckboxCardsItem.displayName = CheckboxGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxCards, CheckboxCardsItem, type CheckboxCardsProps, type CheckboxCardsItemProps };
