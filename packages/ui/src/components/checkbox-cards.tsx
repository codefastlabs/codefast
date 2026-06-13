import { CheckIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { Label } from "#/components/label";
import { cn } from "#/lib/utils";
import * as CheckboxGroupPrimitive from "#/primitives/checkbox-group";

/* -----------------------------------------------------------------------------
 * Component: CheckboxCards
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CheckboxCardsProps = ComponentProps<typeof CheckboxGroupPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function CheckboxCards(props: CheckboxCardsProps): JSX.Element {
  return <CheckboxGroupPrimitive.Root data-slot="checkbox-cards" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxCardsItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface CheckboxCardsItemProps extends ComponentProps<typeof CheckboxGroupPrimitive.Item> {
  checkboxClassName?: string;
}

/**
 * @since 0.3.16-canary.0
 */
function CheckboxCardsItem({ checkboxClassName, children, className, ...props }: CheckboxCardsItemProps): JSX.Element {
  return (
    <Label
      className={cn(
        "flex items-start gap-3 rounded-md border border-input p-3 transition has-focus-visible:border-ring has-disabled:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5",
        className,
      )}
      data-slot="checkbox-card"
    >
      <CheckboxGroupPrimitive.Item
        className={cn(
          "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input shadow-xs transition-shadow duration-(--animation-duration-control) ease-snappy outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
          checkboxClassName,
        )}
        data-slot="checkbox-card-item"
        {...props}
      >
        <CheckboxGroupPrimitive.CheckboxGroupIndicator
          className="grid animate-in place-content-center text-current ease-spring animation-duration-control-indicator zoom-in-50 [&>svg]:size-3.5"
          data-slot="checkbox-card-indicator"
        >
          <CheckIcon />
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
