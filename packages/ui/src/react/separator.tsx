"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

type SeparatorElement = React.ElementRef<typeof SeparatorPrimitive.Root>;
type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

const Separator = React.forwardRef<SeparatorElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn("bg-border shrink-0", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    />
  ),
);

Separator.displayName = SeparatorPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Separator, type SeparatorProps };
