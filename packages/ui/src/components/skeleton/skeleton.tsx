import { cn } from "@/lib/utils";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Skeleton
 * -------------------------------------------------------------------------- */

type SkeletonProps = ComponentProps<"div">;

function Skeleton({ className, ...props }: SkeletonProps): JSX.Element {
  return <div className={cn("bg-muted animate-pulse rounded-lg", className)} data-slot="skeleton" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Skeleton };
export type { SkeletonProps };
