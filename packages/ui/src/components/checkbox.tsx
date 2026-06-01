import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Checkbox({ className, ...props }: CheckboxProps): JSX.Element {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition-[border-color,background-color,box-shadow] duration-150 ease-spring hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-checked:border-primary aria-checked:bg-primary aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 aria-checked:aria-invalid:bg-destructive motion-reduce:transition-none motion-reduce:duration-0 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex animate-in items-center justify-center text-current duration-150 ease-spring zoom-in-50 motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0"
        data-slot="checkbox-indicator"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Checkbox };
export type { CheckboxProps };
