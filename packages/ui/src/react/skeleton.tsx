import * as React from "react";
import { cn } from "../lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Skeleton
 * -------------------------------------------------------------------------- */

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps): React.JSX.Element {
  return <div className={cn("bg-primary/10 animate-pulse rounded", className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Skeleton, type SkeletonProps };
