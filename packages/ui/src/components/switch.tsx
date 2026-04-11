"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#lib/utils";
import * as SwitchPrimitives from "@radix-ui/react-switch";

/* -----------------------------------------------------------------------------
 * Component: Switch
 * -------------------------------------------------------------------------- */

type SwitchProps = ComponentProps<typeof SwitchPrimitives.Root>;

function Switch({ className, ...props }: SwitchProps): JSX.Element {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent p-0.75 shadow-xs outline-hidden transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:not-data-checked:border-ring/60 disabled:opacity-50 data-checked:bg-primary data-checked:focus-visible:ring-primary/20 dark:data-checked:focus-visible:ring-primary/40 data-unchecked:bg-input dark:data-unchecked:bg-input/80",
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitives.Thumb
        className="pointer-events-none block size-3.5 rounded-full bg-background shadow-sm transition-transform dark:not-data-checked:bg-foreground data-checked:translate-x-3.5 data-unchecked:translate-x-0"
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
