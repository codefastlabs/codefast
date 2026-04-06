"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import { composeEventHandlers } from "@radix-ui/primitive";

/* -----------------------------------------------------------------------------
 * Component: Radio
 * -------------------------------------------------------------------------- */

interface RadioProps extends Omit<ComponentProps<"input">, "type"> {
  onValueChange?: (value: string) => void;
}

function Radio({ className, onChange, onValueChange, ...props }: RadioProps): JSX.Element {
  return (
    <input
      className={cn(
        "peer inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded-full border border-field-border shadow-xs outline-hidden after:size-full after:rounded-full after:bg-background after:transition-[width,height] not-checked:after:bg-field checked:border-primary checked:bg-primary checked:after:size-1 hover:not-disabled:not-checked:border-field-border-hover focus-visible:ring-3 focus-visible:ring-ring-focus focus-visible:not-checked:border-ring focus-visible:checked:ring-ring-focus disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-ring-destructive checked:aria-invalid:bg-destructive hover:not-disabled:not-checked:aria-invalid:border-destructive/60",
        className,
      )}
      data-slot="radio"
      type="radio"
      onChange={composeEventHandlers(onChange, (event) =>
        onValueChange?.(event.currentTarget.value),
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Radio };
export type { RadioProps };
