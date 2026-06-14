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
      className={cn(
        "animate-shimmer rounded-md bg-linear-to-r from-muted via-white/15 to-muted bg-size-[400%_100%]",
        className,
      )}
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
