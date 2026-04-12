"use client";

import type { VariantProps } from "#lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn, tv } from "#lib/utils";
import { Slot } from "@radix-ui/react-slot";

import { Separator } from "#components/separator";

/* -----------------------------------------------------------------------------
 * Variants: ButtonGroup
 * -------------------------------------------------------------------------- */

const buttonGroupVariants = tv({
  base: [
    "flex w-fit items-stretch",
    "has-[>[data-slot=button-group]]:gap-2",
    "[&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  ],
  defaultVariants: {
    orientation: "horizontal",
  },
  variants: {
    orientation: {
      horizontal:
        "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
      vertical: [
        "flex-col",
        "[&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      ],
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: ButtonGroup
 * -------------------------------------------------------------------------- */

type ButtonGroupProps = ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>;

function ButtonGroup({ className, orientation, ...props }: ButtonGroupProps): JSX.Element {
  return (
    <div
      className={buttonGroupVariants({ orientation, className })}
      data-orientation={orientation}
      data-slot="button-group"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ButtonGroupText
 * -------------------------------------------------------------------------- */

interface ButtonGroupTextProps extends ComponentProps<"div"> {
  asChild?: boolean;
}

function ButtonGroupText({
  asChild = false,
  className,
  ...props
}: ButtonGroupTextProps): JSX.Element {
  const Component = asChild ? Slot : "div";

  return (
    <Component
      className={cn(
        "flex items-center gap-2",
        "px-4",
        "rounded-lg border bg-muted shadow-xs",
        "text-sm font-medium",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ButtonGroupSeparator
 * -------------------------------------------------------------------------- */

type ButtonGroupSeparatorProps = ComponentProps<typeof Separator>;

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps): JSX.Element {
  return (
    <Separator
      className={cn("relative self-stretch", "bg-input", "data-vertical:h-auto", "!m-0", className)}
      data-slot="button-group-separator"
      orientation={orientation}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };

export type { ButtonGroupProps, ButtonGroupSeparatorProps, ButtonGroupTextProps };
