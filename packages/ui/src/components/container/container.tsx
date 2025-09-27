"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "@codefast/tailwind-variants";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Component: Container
 * -------------------------------------------------------------------------- */

interface ContainerProps extends ComponentProps<"div"> {
  asChild?: boolean;
}

function Container({ asChild, className, ...props }: ContainerProps): JSX.Element {
  const Component = asChild ? Slot : "div";

  return <Component className={cn("container", className)} data-slot="container" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Container };
export type { ContainerProps };
