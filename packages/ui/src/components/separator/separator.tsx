"use client";

import type { ComponentProps, JSX } from "react";

import * as SeparatorPrimitive from "@radix-ui/react-separator";

import type { VariantProps } from "@/lib/utils";

import { separatorVariants } from "@/components/separator/separator-variants";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

function Separator({
  align,
  className,
  decorative = true,
  orientation,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root> &
  Omit<VariantProps<typeof separatorVariants>, "orientation">): JSX.Element {
  return (
    <SeparatorPrimitive.Root
      className={separatorVariants({ align, className, orientation })}
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SeparatorItem
 * -------------------------------------------------------------------------- */

function SeparatorItem({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn("bg-background text-muted-foreground absolute mx-2 px-2 text-sm", className)}
      data-slot="separator-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Separator, SeparatorItem };
