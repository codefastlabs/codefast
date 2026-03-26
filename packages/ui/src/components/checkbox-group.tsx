"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import { CheckIcon } from "lucide-react";

import * as CheckboxGroupPrimitive from "@/primitives/checkbox-group";

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

type CheckboxGroupProps = ComponentProps<typeof CheckboxGroupPrimitive.Root>;

function CheckboxGroup({ className, ...props }: CheckboxGroupProps): JSX.Element {
  return (
    <CheckboxGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      data-slot="checkbox-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

type CheckboxGroupItemProps = ComponentProps<typeof CheckboxGroupPrimitive.Item>;

function CheckboxGroupItem({ className, ...props }: CheckboxGroupItemProps): JSX.Element {
  return (
    <CheckboxGroupPrimitive.Item
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input text-primary-foreground shadow-xs outline-hidden transition hover:not-disabled:not-aria-checked:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-checked:border-primary aria-checked:bg-primary focus-visible:aria-checked:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 hover:not-disabled:not-aria-checked:aria-invalid:border-destructive/60 aria-checked:aria-invalid:bg-destructive dark:bg-input/30 dark:focus-visible:aria-checked:ring-primary/40 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      data-slot="checkbox-group-item"
      {...props}
    >
      <CheckboxGroupPrimitive.CheckboxGroupIndicator
        className="flex items-center justify-center text-current transition-none"
        data-slot="checkbox-group-indicator"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxGroupPrimitive.CheckboxGroupIndicator>
    </CheckboxGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxGroup, CheckboxGroupItem };
export type { CheckboxGroupItemProps, CheckboxGroupProps };
