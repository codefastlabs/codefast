"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: ScrollArea
 * -------------------------------------------------------------------------- */

type ScrollAreaProps = ScrollAreaPrimitive.ScrollAreaProps;
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaScrollbar orientation="vertical" />
    <ScrollAreaScrollbar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: ScrollAreaScrollbar
 * -------------------------------------------------------------------------- */

type ScrollAreaScrollbarProps = ScrollAreaPrimitive.ScrollAreaScrollbarProps;
const ScrollAreaScrollbar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  ScrollAreaScrollbarProps
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-px",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-px",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="bg-border relative flex-1 rounded-full" />
  </ScrollAreaPrimitive.Scrollbar>
));
ScrollAreaScrollbar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  ScrollArea,
  ScrollAreaScrollbar,
  type ScrollAreaProps,
  type ScrollAreaScrollbarProps,
};
