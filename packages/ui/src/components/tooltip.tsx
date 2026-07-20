import * as TooltipPrimitive from "radix-ui/tooltip";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

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
function TooltipProvider({ delayDuration = 0, ...props }: TooltipProviderProps): JSX.Element {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
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
function TooltipContent({ children, className, sideOffset = 0, ...props }: TooltipContentProps): JSX.Element {
  return (
    <TooltipPrimitive.Portal data-slot="tooltip-portal">
      <TooltipPrimitive.Content
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background ease-snappy has-data-[slot=kbd]:pe-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-open:animate-in data-open:animation-duration-menu-in data-open:fade-in-0 data-open:zoom-in-95 data-open:data-side-top:slide-in-from-bottom-2 data-open:data-side-right:slide-in-from-left-2 data-open:data-side-bottom:slide-in-from-top-2 data-open:data-side-left:slide-in-from-right-2 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-menu-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:data-side-top:slide-out-to-bottom-2 data-closed:data-side-right:slide-out-to-left-2 data-closed:data-side-bottom:slide-out-to-top-2 data-closed:data-side-left:slide-out-to-right-2 data-delayed-open:animate-in data-delayed-open:animation-duration-menu-in data-delayed-open:fade-in-0 data-delayed-open:zoom-in-95 data-delayed-open:data-side-top:slide-in-from-bottom-2 data-delayed-open:data-side-right:slide-in-from-left-2 data-delayed-open:data-side-bottom:slide-in-from-top-2 data-delayed-open:data-side-left:slide-in-from-right-2",
          className,
        )}
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
      className={cn(
        "z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-xs bg-foreground fill-foreground",
        className,
      )}
      data-slot="tooltip-arrow"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
export type { TooltipArrowProps, TooltipContentProps, TooltipProps, TooltipProviderProps, TooltipTriggerProps };
