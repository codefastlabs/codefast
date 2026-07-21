import * as RadioGroupPrimitive from "radix-ui/radio-group";
import type { ComponentProps, JSX } from "react";

import { Label } from "#/components/label";
import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: RadioCards
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type RadioCardsProps = ComponentProps<typeof RadioGroupPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function RadioCards(props: RadioCardsProps): JSX.Element {
  return <RadioGroupPrimitive.Root data-slot="radio-cards" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioCardsItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type RadioCardsItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

/**
 * @since 0.3.16-canary.0
 */
function RadioCardsItem({ children, className, ...props }: RadioCardsItemProps): JSX.Element {
  return (
    <Label
      className="flex items-start gap-2.5 rounded-lg border border-input p-2.5 transition has-focus-visible:border-ring has-disabled:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10"
      data-slot="radio-card"
    >
      <RadioGroupPrimitive.Item
        className={cn(
          "peer relative mt-0.5 flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
          className,
        )}
        data-slot="radio-card-item"
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          className="flex size-4 items-center justify-center"
          data-slot="radio-card-indicator"
        >
          <span className="absolute inset-s-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 animate-in rounded-full bg-primary-foreground duration-control-indicator ease-spring zoom-in-50 rtl:translate-x-1/2" />
        </RadioGroupPrimitive.Indicator>
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
