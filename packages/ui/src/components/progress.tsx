import * as ProgressPrimitive from "radix-ui/progress";
import type { ComponentProps, JSX } from "react";

import { cn } from "#lib/utils";

// ── Component: Progress ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root>;

/**
 * A horizontal bar that fills to `value` out of `max`.
 *
 * @remarks `value` defaults to `0` and is clamped to `max`; `null` marks the work indeterminate, which leaves out
 * `aria-valuenow`.
 *
 * @since 0.3.16-canary.0
 */
function Progress({ className, max = 100, value = 0, ...props }: ProgressProps): JSX.Element {
  // One clamped value feeds both Radix's ARIA state and the fill, so what is announced is what is drawn.
  const clampedValue = value === null ? null : Math.min(Math.max(value, 0), max);
  const filledPercent = clampedValue === null ? 0 : (clampedValue / max) * 100;

  return (
    <ProgressPrimitive.Root
      className={cn("relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted", className)}
      data-slot="progress"
      max={max}
      value={clampedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="size-full flex-1 bg-primary transition-all"
        data-slot="progress-indicator"
        style={{
          transform: `translateX(-${(100 - filledPercent).toString()}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

// ── Exports ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export { Progress };
export type { ProgressProps };
