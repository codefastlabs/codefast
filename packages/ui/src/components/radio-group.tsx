"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#utils/tv";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

type RadioGroupProps = ComponentProps<typeof RadioGroupPrimitive.Root>;

function RadioGroup({ className, ...props }: RadioGroupProps): JSX.Element {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      data-slot="radio-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: RadioGroupItem
 * -------------------------------------------------------------------------- */

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

function RadioGroupItem({ className, ...props }: RadioGroupItemProps): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center",
        "rounded-full border border-field-border bg-field shadow-xs",
        "outline-hidden transition",
        "hover:not-disabled:not-aria-checked:border-field-border-hover",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring-focus",
        "disabled:opacity-50",
        "aria-checked:border-primary aria-checked:bg-primary focus-visible:aria-checked:ring-ring-primary",
        "aria-invalid:border-destructive aria-invalid:ring-ring-destructive",
        "hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 aria-checked:aria-invalid:bg-destructive",
        className,
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className="size-1 rounded-full bg-background"
        data-slot="radio-group-indicator"
      />
    </RadioGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioGroup, RadioGroupItem };
export type { RadioGroupItemProps, RadioGroupProps };
