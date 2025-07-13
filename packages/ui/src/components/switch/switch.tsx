"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";
import * as SwitchPrimitives from "@radix-ui/react-switch";

/* -----------------------------------------------------------------------------
 * Component: Switch
 * -------------------------------------------------------------------------- */

type SwitchProps = ComponentProps<typeof SwitchPrimitives.Root>;

function Switch({ className, ...props }: SwitchProps): JSX.Element {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "p-0.75 data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80 data-[state=checked]:bg-primary data-[state=checked]:focus-visible:ring-primary/20 dark:data-[state=checked]:focus-visible:ring-primary/40 focus-visible:not-data-[state=checked]:border-ring/60 focus-visible:ring-ring/50 focus-visible:ring-3 shadow-xs outline-hidden peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-all disabled:opacity-50",
        className,
      )}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitives.Thumb
        className="bg-background dark:not-data-[state=checked]:bg-foreground pointer-events-none block size-3.5 rounded-full shadow-sm transition-transform data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0"
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
