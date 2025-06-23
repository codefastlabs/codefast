"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Label
 * -------------------------------------------------------------------------- */

function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>): JSX.Element {
  return (
    <LabelPrimitive.Root
      className={cn(
        "peer-data-disabled:opacity-50 group-data-disabled:opacity-50 data-invalid:text-destructive peer-aria-invalid:text-destructive inline-block text-sm font-medium leading-none peer-disabled:opacity-50",
        className,
      )}
      data-slot="label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Label };
