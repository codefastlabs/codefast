"use client";

import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@/lib/utils";

import { separatorVariants } from "@/components/separator/separator.variants";
import { cn } from "@/lib/utils";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

interface SeparatorProps
  extends ComponentProps<typeof SeparatorPrimitive.Root>,
    Omit<VariantProps<typeof separatorVariants>, "orientation"> {}

function Separator({ align, className, decorative = true, orientation, ...props }: SeparatorProps): JSX.Element {
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

type SeparatorItemProps = ComponentProps<"div">;

function SeparatorItem({ className, ...props }: SeparatorItemProps): JSX.Element {
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
export type { SeparatorItemProps, SeparatorProps };
