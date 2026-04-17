import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Skeleton
 * -------------------------------------------------------------------------- */

type SkeletonProps = ComponentProps<"div">;

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
