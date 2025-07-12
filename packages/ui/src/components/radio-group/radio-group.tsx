"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: RadioGroup
 * -------------------------------------------------------------------------- */

type RadioGroupProps = ComponentProps<typeof RadioGroupPrimitive.Root>;

function RadioGroup({ className, ...props }: RadioGroupProps): JSX.Element {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} data-slot="radio-group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: RadioGroupItem
 * -------------------------------------------------------------------------- */

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

function RadioGroupItem({ className, ...props }: RadioGroupItemProps): JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "border-input shadow-xs outline-hidden hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:aria-checked:ring-primary/20 dark:focus-visible:aria-checked:ring-primary/40 aria-checked:border-primary aria-checked:bg-primary aria-checked:aria-invalid:bg-destructive aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 dark:bg-input/30 peer inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-50",
        className,
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="bg-background size-1 rounded-full" data-slot="radio-group-indicator" />
    </RadioGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { RadioGroup, RadioGroupItem };
export type { RadioGroupProps, RadioGroupItemProps };
