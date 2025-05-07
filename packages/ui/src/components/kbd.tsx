"use client";

import type { ComponentProps, JSX } from "react";

import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Kbd
 * -------------------------------------------------------------------------- */

function Kbd({
  asChild,
  className,
  ...props
}: ComponentProps<"kbd"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "kbd";

  return (
    <Component
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-5 select-none items-center gap-1 rounded-sm border px-1.5 font-mono text-xs font-medium",
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Kbd };
