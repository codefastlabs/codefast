"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";
import * as ProgressPrimitive from "@radix-ui/react-progress";

/* -----------------------------------------------------------------------------
 * Component: Progress
 * -------------------------------------------------------------------------- */

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root>;

function Progress({ className, value, ...props }: ProgressProps): JSX.Element {
  return (
    <ProgressPrimitive.Root
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      data-slot="progress"
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="bg-primary size-full flex-1 transition-all"
        data-slot="progress-indicator"
        style={{
          transform: `translateX(-${(100 - (value ?? 0)).toString()}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Progress };
export type { ProgressProps };
