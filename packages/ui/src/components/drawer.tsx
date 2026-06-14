import type { ComponentProps, JSX } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import type { VariantProps } from "#/lib/utils";
import { cn } from "#/lib/utils";
import { buttonVariants } from "#/variants/button";

/* -----------------------------------------------------------------------------
 * Component: Drawer
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DrawerProps = ComponentProps<typeof DrawerPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Drawer({ shouldScaleBackground = true, ...props }: DrawerProps): JSX.Element {
  return <DrawerPrimitive.Root data-slot="drawer" shouldScaleBackground={shouldScaleBackground} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DrawerTriggerProps = ComponentProps<typeof DrawerPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function DrawerTrigger({ ...props }: DrawerTriggerProps): JSX.Element {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DrawerContentProps = ComponentProps<typeof DrawerPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function DrawerContent({ children, className, ...props }: DrawerContentProps): JSX.Element {
  return (
    <DrawerPrimitive.Portal data-slot="drawer-portal">
      <DrawerPrimitive.Overlay
        className={
          "fixed inset-0 z-50 bg-black/10 ease-gentle supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:animation-duration-panel-in data-open:fade-in-0 data-closed:animate-out data-closed:ease-exit data-closed:animation-duration-panel-out data-closed:fade-out-0"
        }
        data-slot="drawer-overlay"
      />
      <DrawerPrimitive.Content
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-popover text-sm text-popover-foreground data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:start-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-e-xl data-[vaul-drawer-direction=left]:border-e data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:end-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-s-xl data-[vaul-drawer-direction=right]:border-s data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          className,
        )}
        data-slot="drawer-content"
        {...props}
      >
        <div className="mx-auto mt-4 hidden h-1.5 w-25 shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DrawerHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DrawerHeader({ className, ...props }: DrawerHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-start",
        className,
      )}
      data-slot="drawer-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DrawerFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DrawerFooter({ className, ...props }: DrawerFooterProps): JSX.Element {
  return <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} data-slot="drawer-footer" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DrawerTitleProps = ComponentProps<typeof DrawerPrimitive.Title>;

/**
 * @since 0.3.16-canary.0
 */
function DrawerTitle({ className, ...props }: DrawerTitleProps): JSX.Element {
  return (
    <DrawerPrimitive.Title
      className={cn("font-heading font-medium text-foreground", className)}
      data-slot="drawer-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DrawerDescriptionProps = ComponentProps<typeof DrawerPrimitive.Description>;

/**
 * @since 0.3.16-canary.0
 */
function DrawerDescription({ className, ...props }: DrawerDescriptionProps): JSX.Element {
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="drawer-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DrawerCloseProps extends ComponentProps<typeof DrawerPrimitive.Close> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

/**
 * @since 0.3.16-canary.0
 */
function DrawerClose({ className, size, variant, ...props }: DrawerCloseProps): JSX.Element {
  return (
    <DrawerPrimitive.Close
      className={buttonVariants({ className, size, variant })}
      data-slot="drawer-close"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
};
export type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
  DrawerTitleProps,
  DrawerTriggerProps,
};
