"use client";

import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { Separator } from "@/components/separator";
import { cn, tv } from "@codefast/tailwind-variants";
import { Slot } from "@radix-ui/react-slot";

/* -----------------------------------------------------------------------------
 * Variants: ButtonGroup
 * -------------------------------------------------------------------------- */

const buttonGroupVariants = tv({
  base: cn(
    "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2",
    "[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit",
    "[&>*]:focus-visible:relative [&>*]:focus-visible:z-10 [&>input]:flex-1",
    "has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg",
  ),
  defaultVariants: {
    orientation: "horizontal",
  },
  variants: {
    orientation: {
      horizontal:
        "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
      vertical:
        "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
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
      className={cn(buttonGroupVariants({ orientation }), className)}
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
        "bg-muted flex items-center gap-2 rounded-lg border px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
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
      className={cn(
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",
        className,
      )}
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
