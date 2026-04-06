"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import * as SwitchPrimitives from "@radix-ui/react-switch";

/* -----------------------------------------------------------------------------
 * Component: Switch
 * -------------------------------------------------------------------------- */

type SwitchProps = ComponentProps<typeof SwitchPrimitives.Root>;

function Switch({ className, ...props }: SwitchProps): JSX.Element {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full",
        "border border-transparent p-0.75 shadow-xs",
        "outline-hidden transition-all",
        "focus-visible:ring-3 focus-visible:ring-ring-focus focus-visible:not-data-[state=checked]:border-field-border-hover",
        "disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=checked]:focus-visible:ring-ring-focus data-[state=unchecked]:bg-field",
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block",
          "size-3.5 rounded-full bg-background shadow-sm",
          "transition-transform",
          "data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0",
        )}
        data-slot="switch-thumb"
      />
    </SwitchPrimitives.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Switch };
export type { SwitchProps };
