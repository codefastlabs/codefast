"use client";

import type { ComponentProps, JSX } from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Popover
 * -------------------------------------------------------------------------- */

function Popover({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>): JSX.Element {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverTrigger
 * -------------------------------------------------------------------------- */

function PopoverTrigger({ ...props }: ComponentProps<typeof PopoverPrimitive.Trigger>): JSX.Element {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverAnchor
 * -------------------------------------------------------------------------- */

function PopoverAnchor({ ...props }: ComponentProps<typeof PopoverPrimitive.Anchor>): JSX.Element {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverContent
 * -------------------------------------------------------------------------- */

function PopoverContent({
  align = "center",
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>): JSX.Element {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          "bg-popover outline-hidden text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 min-w-32 rounded-lg border p-4 shadow-lg",
          className,
        )}
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PopoverArrow
 * -------------------------------------------------------------------------- */

function PopoverArrow({ className, ...props }: ComponentProps<typeof PopoverPrimitive.Arrow>): JSX.Element {
  return <PopoverPrimitive.Arrow className={cn("fill-popover", className)} data-slot="popover-arrow" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Popover, PopoverAnchor, PopoverArrow, PopoverContent, PopoverTrigger };
