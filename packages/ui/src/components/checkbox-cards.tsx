import * as CheckboxGroupPrimitive from "@codefast-ui/checkbox-group";
import { CheckIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { Label } from "@/components/label";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

function CheckboxCards(props: ComponentProps<typeof CheckboxGroupPrimitive.Root>): JSX.Element {
  return <CheckboxGroupPrimitive.Root data-slot="checkbox-cards" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

function CheckboxCardsItem({
  checkboxClassName,
  children,
  className,
  ...props
}: ComponentProps<typeof CheckboxGroupPrimitive.Item> & {
  checkboxClassName?: string;
}): JSX.Element {
  return (
    <Label
      className={cn(
        "border-input hover:not-has-disabled:not-has-aria-checked:bg-secondary has-aria-checked:bg-primary/10 has-aria-checked:border-primary has-focus-visible:border-ring has-disabled:opacity-50 flex items-start gap-3 rounded-lg border p-3 transition",
        className,
      )}
      data-slot="checkbox-card"
    >
      <CheckboxGroupPrimitive.Item
        className={cn(
          "border-input text-primary-foreground shadow-xs outline-hidden focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:aria-checked:ring-primary/20 dark:focus-visible:aria-checked:ring-primary/40 aria-checked:border-primary aria-checked:bg-primary dark:bg-input/30 peer flex size-4 shrink-0 rounded-sm border transition",
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
