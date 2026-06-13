import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type RadioGroupProps = ComponentProps<typeof RadioGroupPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function RadioGroup({ className, ...props }: RadioGroupProps): JSX.Element {
  return <RadioGroupPrimitive.Root className={cn("grid w-full gap-3", className)} data-slot="radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioGroupItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

/**
 * @since 0.3.16-canary.0
 */
function RadioGroupItem({ className, ...props }: RadioGroupItemProps): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className,
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="flex size-4 items-center justify-center"
        data-slot="radio-group-indicator"
      >
        <span className="absolute start-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 animate-in rounded-full bg-primary-foreground duration-control-indicator ease-spring zoom-in-50 rtl:translate-x-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioGroup, RadioGroupItem };
export type { RadioGroupItemProps, RadioGroupProps };
