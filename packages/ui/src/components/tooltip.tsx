"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

/* -----------------------------------------------------------------------------
 * Component: TooltipProvider
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TooltipProviderProps = ComponentProps<typeof TooltipPrimitive.Provider>;

/**
 * @since 0.3.16-canary.0
 */
function TooltipProvider({ ...props }: TooltipProviderProps): JSX.Element {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: Tooltip
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Tooltip({ ...props }: TooltipProps): JSX.Element {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TooltipTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TooltipTriggerProps = ComponentProps<typeof TooltipPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function TooltipTrigger({ ...props }: TooltipTriggerProps): JSX.Element {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TooltipContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TooltipContentProps = ComponentProps<typeof TooltipPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function TooltipContent({
  children,
  className,
  sideOffset = 4,
  ...props
}: TooltipContentProps): JSX.Element {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          "z-50",
          "w-fit max-w-(--radix-tooltip-content-available-width) px-3 py-1.5",
          "rounded-md",
          "bg-primary text-xs text-balance text-primary-foreground",
          "ease-ui data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          "data-[state=delayed-open]:data-side-top:slide-in-from-bottom-2",
          "data-[state=delayed-open]:data-side-right:slide-in-from-left-2",
          "data-[state=delayed-open]:data-side-bottom:slide-in-from-top-2",
          "data-[state=delayed-open]:data-side-left:slide-in-from-right-2",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "data-closed:data-side-top:slide-out-to-bottom-2",
          "data-closed:data-side-right:slide-out-to-left-2",
          "data-closed:data-side-bottom:slide-out-to-top-2",
          "data-closed:data-side-left:slide-out-to-right-2",
          "origin-(--radix-tooltip-content-transform-origin)",
          className,
        )}
        collisionPadding={8}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        {...props}
      >
        {children}
        <TooltipArrow />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TooltipArrow
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TooltipArrowProps = ComponentProps<typeof TooltipPrimitive.Arrow>;

/**
 * @since 0.3.16-canary.0
 */
function TooltipArrow({ className, ...props }: TooltipArrowProps): JSX.Element {
  return (
    <TooltipPrimitive.Arrow
      className={cn("fill-primary", className)}
      data-slot="tooltip-arrow"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
export type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipProps,
  TooltipProviderProps,
  TooltipTriggerProps,
};
