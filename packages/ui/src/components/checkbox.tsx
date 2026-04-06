"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: Checkbox
 * -------------------------------------------------------------------------- */

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root>;

function Checkbox({ className, ...props }: CheckboxProps): JSX.Element {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center",
        "rounded-sm border border-field-border bg-field shadow-xs",
        "text-primary-foreground",
        "outline-hidden transition",
        "hover:not-disabled:not-aria-checked:border-field-border-hover",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring-focus",
        "disabled:opacity-50",
        "aria-checked:border-primary aria-checked:bg-primary aria-checked:focus-visible:ring-ring-focus",
        "aria-invalid:border-destructive aria-invalid:ring-ring-destructive",
        "hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 aria-checked:aria-invalid:bg-destructive",
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
export type { CheckboxProps };
