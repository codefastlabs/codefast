import { cn } from "@/lib/utils";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Skeleton
 * -------------------------------------------------------------------------- */

function Skeleton({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <div className={cn("bg-muted animate-pulse rounded-lg", className)} data-slot="skeleton" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Skeleton };
