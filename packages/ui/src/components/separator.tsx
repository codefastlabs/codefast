"use client";

import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn, tv } from "#/lib/utils";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

/* -----------------------------------------------------------------------------
 * Variant: Separator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const separatorVariants = tv({
  base: ["relative flex shrink-0 items-center", "bg-border"],
  defaultVariants: {
    align: "center",
    orientation: "horizontal",
  },
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
});

/* -----------------------------------------------------------------------------
 * Component: Separator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SeparatorProps
  extends
    ComponentProps<typeof SeparatorPrimitive.Root>,
    Omit<VariantProps<typeof separatorVariants>, "orientation"> {}

/**
 * @since 0.3.16-canary.0
 */
function Separator({
  align,
  className,
  decorative = true,
  orientation,
  ...props
}: SeparatorProps): JSX.Element {
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

/**
 * @since 0.3.16-canary.0
 */
type SeparatorItemProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SeparatorItem({ className, ...props }: SeparatorItemProps): JSX.Element {
  return (
    <div
      className={cn(
        "absolute",
        "mx-2 px-2",
        "bg-background text-sm text-muted-foreground",
        className,
      )}
      data-slot="separator-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { separatorVariants };
export { Separator, SeparatorItem };
export type { SeparatorItemProps, SeparatorProps };
