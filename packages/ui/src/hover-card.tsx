"use client";

import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: HoverCard
 * -------------------------------------------------------------------------- */

const HoverCard = HoverCardPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: HoverCardTrigger
 * -------------------------------------------------------------------------- */

const HoverCardTrigger = HoverCardPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: HoverCardContent
 * -------------------------------------------------------------------------- */

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  HoverCardPrimitive.HoverCardContentProps
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "bg-popover text-popover-foreground z-50 w-64 rounded-md border p-4 shadow-md outline-none",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
      "data-[state=open]:data-[side=top]:slide-in-from-bottom-2",
      "data-[state=open]:data-[side=left]:slide-in-from-right-2",
      "data-[state=open]:data-[side=bottom]:slide-in-from-top-2",
      "data-[state=open]:data-[side=right]:slide-in-from-left-2",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[state=closed]:data-[side=top]:slide-out-to-bottom-2",
      "data-[state=closed]:data-[side=left]:slide-out-to-right-2",
      "data-[state=closed]:data-[side=bottom]:slide-out-to-top-2",
      "data-[state=closed]:data-[side=right]:slide-out-to-left-2",
      className,
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { HoverCard, HoverCardTrigger, HoverCardContent };
