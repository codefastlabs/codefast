"use client";

import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Container
 * -------------------------------------------------------------------------- */

function Container({
  asChild,
  className,
  ...props
}: ComponentProps<"div"> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : "div";

  return <Component className={cn("container", className)} data-slot="container" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Container };
