import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Popover
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Popover({ ...props }: PopoverProps): JSX.Element {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function PopoverTrigger({ ...props }: PopoverTriggerProps): JSX.Element {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverAnchor
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PopoverAnchorProps = ComponentProps<typeof PopoverPrimitive.Anchor>;

/**
 * @since 0.3.16-canary.0
 */
function PopoverAnchor({ ...props }: PopoverAnchorProps): JSX.Element {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function PopoverContent({ align = "center", className, sideOffset = 4, ...props }: PopoverContentProps): JSX.Element {
  return (
    <PopoverPrimitive.Portal data-slot="popover-portal">
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          "z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden ease-snappy data-open:animate-in data-open:animation-duration-popup-in data-open:fade-in-0 data-open:zoom-in-95 data-open:data-side-top:slide-in-from-bottom-2 data-open:data-side-right:slide-in-from-left-2 data-open:data-side-bottom:slide-in-from-top-2 data-open:data-side-left:slide-in-from-right-2 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-popup-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:data-side-top:slide-out-to-bottom-2 data-closed:data-side-right:slide-out-to-left-2 data-closed:data-side-bottom:slide-out-to-top-2 data-closed:data-side-left:slide-out-to-right-2",
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

/**
 * @since 0.3.16-canary.0
 */
type PopoverArrowProps = ComponentProps<typeof PopoverPrimitive.Arrow>;

/**
 * @since 0.3.16-canary.0
 */
function PopoverArrow({ className, ...props }: PopoverArrowProps): JSX.Element {
  return <PopoverPrimitive.Arrow className={cn("fill-popover", className)} data-slot="popover-arrow" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PopoverHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function PopoverHeader({ className, ...props }: PopoverHeaderProps): JSX.Element {
  return <div className={cn("flex flex-col gap-1 text-sm", className)} data-slot="popover-header" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PopoverTitleProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function PopoverTitle({ className, ...props }: PopoverTitleProps): JSX.Element {
  return <div className={cn("font-medium", className)} data-slot="popover-title" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PopoverDescriptionProps = ComponentProps<"p">;

/**
 * @since 0.3.16-canary.0
 */
function PopoverDescription({ className, ...props }: PopoverDescriptionProps): JSX.Element {
  return <p className={cn("text-muted-foreground", className)} data-slot="popover-description" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
export type {
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverHeaderProps,
  PopoverProps,
  PopoverTitleProps,
  PopoverTriggerProps,
};
