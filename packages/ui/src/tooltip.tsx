"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: TooltipProvider
 * -------------------------------------------------------------------------- */

const TooltipProvider = TooltipPrimitive.Provider;

/* -----------------------------------------------------------------------------
 * Component: Tooltip
 * -------------------------------------------------------------------------- */

const Tooltip = TooltipPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: TooltipTrigger
 * -------------------------------------------------------------------------- */

const TooltipTrigger = TooltipPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: TooltipPortal
 * -------------------------------------------------------------------------- */

const TooltipPortal = TooltipPrimitive.Portal;

/* -----------------------------------------------------------------------------
 * Component: TooltipArrow
 * -------------------------------------------------------------------------- */

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  TooltipPrimitive.TooltipArrowProps
>((props, ref) => (
  <TooltipPrimitive.Arrow ref={ref} className="fill-primary" {...props} />
));
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Component: TooltipContent
 * -------------------------------------------------------------------------- */

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipPrimitive.TooltipContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "bg-primary text-primary-foreground z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs",
      "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
      "data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-2",
      "data-[state=delayed-open]:data-[side=right]:slide-in-from-left-2",
      "data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-2",
      "data-[state=delayed-open]:data-[side=left]:slide-in-from-right-2",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[state=closed]:data-[side=top]:slide-out-to-bottom-2",
      "data-[state=closed]:data-[side=right]:slide-out-to-left-2",
      "data-[state=closed]:data-[side=bottom]:slide-out-to-top-2",
      "data-[state=closed]:data-[side=left]:slide-out-to-right-2",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Tooltip,
  TooltipPortal,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
};
