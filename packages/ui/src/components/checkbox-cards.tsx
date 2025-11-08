"use client";

import type { ComponentProps, JSX } from "react";

import { CheckIcon } from "lucide-react";

import { Label } from "@/components/label";
import * as CheckboxGroupPrimitive from "@/primitives/checkbox-group";
import { cn } from "@codefast/tailwind-variants";

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
        "border-input hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring flex items-start gap-3 rounded-lg border p-3 transition has-disabled:opacity-50",
        className,
      )}
      data-slot="checkbox-card"
    >
      <CheckboxGroupPrimitive.Item
        className={cn(
          "border-input text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:aria-checked:ring-primary/20 dark:focus-visible:aria-checked:ring-primary/40 aria-checked:border-primary aria-checked:bg-primary dark:bg-input/30 peer flex size-4 shrink-0 rounded-sm border shadow-xs outline-hidden transition focus-visible:ring-3",
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
