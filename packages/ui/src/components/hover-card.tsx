"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

/* -----------------------------------------------------------------------------
 * Component: HoverCard
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type HoverCardProps = ComponentProps<typeof HoverCardPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function HoverCard({ ...props }: HoverCardProps): JSX.Element {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: HoverCardTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type HoverCardTriggerProps = ComponentProps<typeof HoverCardPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function HoverCardTrigger({ ...props }: HoverCardTriggerProps): JSX.Element {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: HoverCardContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type HoverCardContentProps = ComponentProps<typeof HoverCardPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function HoverCardContent({
  align = "center",
  className,
  sideOffset = 4,
  ...props
}: HoverCardContentProps): JSX.Element {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        className={cn(
          "z-50",
          "min-w-32 p-4",
          "rounded-lg border",
          "bg-popover text-popover-foreground shadow-lg",
          "ease-ui data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-open:data-side-top:slide-in-from-bottom-2",
          "data-open:data-side-right:slide-in-from-left-2",
          "data-open:data-side-bottom:slide-in-from-top-2",
          "data-open:data-side-left:slide-in-from-right-2",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "data-closed:data-side-top:slide-out-to-bottom-2",
          "data-closed:data-side-right:slide-out-to-left-2",
          "data-closed:data-side-bottom:slide-out-to-top-2",
          "data-closed:data-side-left:slide-out-to-right-2",
          "origin-(--radix-hover-card-content-transform-origin)",
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

/**
 * @since 0.3.16-canary.0
 */
type HoverCardArrowProps = ComponentProps<typeof HoverCardPrimitive.Arrow>;

/**
 * @since 0.3.16-canary.0
 */
function HoverCardArrow({ className, ...props }: HoverCardArrowProps): JSX.Element {
  return (
    <HoverCardPrimitive.Arrow
      className={cn("fill-popover", className)}
      data-slot="hover-card-arrow"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { HoverCard, HoverCardArrow, HoverCardContent, HoverCardTrigger };
export type { HoverCardArrowProps, HoverCardContentProps, HoverCardProps, HoverCardTriggerProps };
