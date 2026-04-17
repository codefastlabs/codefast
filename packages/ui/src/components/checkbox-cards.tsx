"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { CheckIcon } from "lucide-react";

import { Label } from "#/components/label";
import * as CheckboxGroupPrimitive from "#/primitives/checkbox-group";

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

type CheckboxCardsProps = ComponentProps<typeof CheckboxGroupPrimitive.Root>;

function CheckboxCards(props: CheckboxCardsProps): JSX.Element {
  return <CheckboxGroupPrimitive.Root data-slot="checkbox-cards" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

interface CheckboxCardsItemProps extends ComponentProps<typeof CheckboxGroupPrimitive.Item> {
  checkboxClassName?: string;
}

function CheckboxCardsItem({
  checkboxClassName,
  children,
  className,
  ...props
}: CheckboxCardsItemProps): JSX.Element {
  return (
    <Label
      className={cn(
        "flex items-start gap-3",
        "p-3",
        "rounded-lg border border-input",
        "transition",
        "hover:not-has-disabled:not-has-aria-checked:bg-secondary",
        "has-focus-visible:border-ring",
        "has-disabled:opacity-50",
        "has-aria-checked:border-primary has-aria-checked:bg-primary/10",
        className,
      )}
      data-slot="checkbox-card"
    >
      <CheckboxGroupPrimitive.Item
        className={cn(
          "peer flex size-4 shrink-0",
          "rounded-sm border border-input shadow-xs outline-hidden",
          "text-primary-foreground",
          "transition",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "aria-checked:border-primary aria-checked:bg-primary",
          "focus-visible:aria-checked:ring-primary/20",
          "dark:bg-input/30",
          "dark:focus-visible:aria-checked:ring-primary/40",
          checkboxClassName,
        )}
        data-slot="checkbox-card-item"
        {...props}
      >
        <CheckboxGroupPrimitive.CheckboxGroupIndicator data-slot="checkbox-card-indicator">
          <CheckIcon className="size-3.5" />
        </CheckboxGroupPrimitive.CheckboxGroupIndicator>
      </CheckboxGroupPrimitive.Item>
      {children}
    </Label>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxCards, CheckboxCardsItem };
export type { CheckboxCardsItemProps, CheckboxCardsProps };
