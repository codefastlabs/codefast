import { composeEventHandlers } from "radix-ui/internal";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Radio
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface RadioProps extends Omit<ComponentProps<"input">, "type"> {
  onValueChange?: (value: string) => void;
}

/**
 * @since 0.3.16-canary.0
 */
function Radio({ className, onChange, onValueChange, ...props }: RadioProps): JSX.Element {
  return (
    <input
      className={cn(
        "peer relative flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border border-input bg-background shadow-xs outline-none before:size-2 before:scale-0 before:rounded-full before:bg-primary-foreground before:transition-transform before:duration-control-indicator before:ease-spring after:absolute after:-inset-x-3 after:-inset-y-2 checked:border-primary checked:bg-primary checked:before:scale-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:not-checked:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 checked:aria-invalid:bg-destructive dark:not-checked:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      data-slot="radio"
      type="radio"
      onChange={composeEventHandlers(onChange, (event) => onValueChange?.(event.currentTarget.value))}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Radio };
export type { RadioProps };
