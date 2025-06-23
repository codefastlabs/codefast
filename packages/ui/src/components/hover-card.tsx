"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: HoverCard
 * -------------------------------------------------------------------------- */

function HoverCard({ ...props }: ComponentProps<typeof HoverCardPrimitive.Root>): JSX.Element {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: HoverCardTrigger
 * -------------------------------------------------------------------------- */

function HoverCardTrigger({ ...props }: ComponentProps<typeof HoverCardPrimitive.Trigger>): JSX.Element {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: HoverCardContent
 * -------------------------------------------------------------------------- */

function HoverCardContent({
  align = "center",
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Content>): JSX.Element {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 z-50 min-w-32 rounded-lg border p-4 shadow-lg",
          className,
        )}
        data-slot="hover-card-content"
        sideOffset={sideOffset}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: HoverCardArrow
 * -------------------------------------------------------------------------- */

function HoverCardArrow({ className, ...props }: ComponentProps<typeof HoverCardPrimitive.Arrow>): JSX.Element {
  return <HoverCardPrimitive.Arrow className={cn("fill-popover", className)} data-slot="hover-card-arrow" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { HoverCard, HoverCardArrow, HoverCardContent, HoverCardTrigger };
