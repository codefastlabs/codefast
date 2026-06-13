import { CheckIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as CheckboxGroupPrimitive from "#/primitives/checkbox-group";

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CheckboxGroupProps = ComponentProps<typeof CheckboxGroupPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function CheckboxGroup({ className, ...props }: CheckboxGroupProps): JSX.Element {
  return <CheckboxGroupPrimitive.Root className={cn("grid gap-2", className)} data-slot="checkbox-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CheckboxGroupItemProps = ComponentProps<typeof CheckboxGroupPrimitive.Item>;

/**
 * @since 0.3.16-canary.0
 */
function CheckboxGroupItem({ className, ...props }: CheckboxGroupItemProps): JSX.Element {
  return (
    <CheckboxGroupPrimitive.Item
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input shadow-xs transition-shadow duration-control ease-snappy outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className,
      )}
      data-slot="checkbox-group-item"
      {...props}
    >
      <CheckboxGroupPrimitive.CheckboxGroupIndicator
        className="grid animate-in place-content-center text-current duration-control-indicator ease-spring zoom-in-50 [&>svg]:size-3.5"
        data-slot="checkbox-group-indicator"
      >
        <CheckIcon />
      </CheckboxGroupPrimitive.CheckboxGroupIndicator>
    </CheckboxGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxGroup, CheckboxGroupItem };
export type { CheckboxGroupItemProps, CheckboxGroupProps };
