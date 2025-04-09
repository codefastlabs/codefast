import type { ComponentProps, JSX } from "react";

import * as SeparatorPrimitive from "@radix-ui/react-separator";

import type { VariantProps } from "@/lib/utils";

import { cn, tv } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

const separatorVariants = tv({
  base: "bg-border relative flex shrink-0 items-center",
  variants: {
    align: {
      center: "justify-center",
      end: "justify-end",
      start: "justify-start",
    },
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px flex-col",
    },
  },
  defaultVariants: {
    align: "center",
    orientation: "horizontal",
  },
});

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
