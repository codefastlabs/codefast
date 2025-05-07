"use client";

import type { ComponentProps, JSX } from "react";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>): JSX.Element {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "border-input text-primary-foreground shadow-xs outline-hidden hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-checked:focus-visible:ring-primary/20 dark:aria-checked:focus-visible:ring-primary/40 aria-checked:border-primary aria-checked:aria-invalid:bg-destructive aria-checked:bg-primary aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 dark:bg-input/30 peer flex size-4 shrink-0 items-center justify-center rounded-sm border transition disabled:opacity-50",
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex items-center justify-center text-current transition-none"
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
