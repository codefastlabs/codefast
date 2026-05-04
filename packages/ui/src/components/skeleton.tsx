import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Skeleton
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SkeletonProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function Skeleton({ className, ...props }: SkeletonProps): JSX.Element {
  return (
    <div
      className={cn("rounded-lg", "bg-muted", "animate-pulse", className)}
      data-slot="skeleton"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Skeleton };
export type { SkeletonProps };
