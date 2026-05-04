"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as ProgressPrimitive from "@radix-ui/react-progress";

/* -----------------------------------------------------------------------------
 * Component: Progress
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Progress({ className, value, ...props }: ProgressProps): JSX.Element {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative",
        "h-2 w-full overflow-hidden",
        "rounded-full",
        "bg-primary/20",
        className,
      )}
      data-slot="progress"
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("size-full flex-1", "bg-primary", "transition-all")}
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
