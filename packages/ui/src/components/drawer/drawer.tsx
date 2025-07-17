"use client";

import type { ComponentProps, JSX } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import type { VariantProps } from "@/lib/utils";

import { buttonVariants } from "@/components/button/button.variants";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Drawer
 * -------------------------------------------------------------------------- */

type DrawerProps = ComponentProps<typeof DrawerPrimitive.Root>;

function Drawer({ shouldScaleBackground = true, ...props }: DrawerProps): JSX.Element {
  return <DrawerPrimitive.Root data-slot="drawer" shouldScaleBackground={shouldScaleBackground} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTrigger
 * -------------------------------------------------------------------------- */

type DrawerTriggerProps = ComponentProps<typeof DrawerPrimitive.Trigger>;

function DrawerTrigger({ ...props }: DrawerTriggerProps): JSX.Element {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

interface DrawerContentProps extends ComponentProps<typeof DrawerPrimitive.Content> {
  classNames?: {
    content?: string;
    handle?: string;
    overlay?: string;
  };
}

function DrawerContent({ children, className, classNames, ...props }: DrawerContentProps): JSX.Element {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay
        className={cn("bg-popover-overlay fixed inset-0 z-50", classNames?.overlay)}
        data-slot="drawer-overlay"
      />
      <DrawerPrimitive.Content
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=bottom]:rounded-t-2xl data-[vaul-drawer-direction=top]:rounded-b-2xl data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          classNames?.content,
          className,
        )}
        data-slot="drawer-content"
        {...props}
      >
        <div
          className={cn(
            "bg-muted mx-auto mt-4 hidden h-1.5 w-12 shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block",
            classNames?.handle,
          )}
        />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerHeader
 * -------------------------------------------------------------------------- */

type DrawerHeaderProps = ComponentProps<"div">;

function DrawerHeader({ className, ...props }: DrawerHeaderProps): JSX.Element {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} data-slot="drawer-header" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerBody
 * -------------------------------------------------------------------------- */

type DrawerBodyProps = ComponentProps<"div">;

function DrawerBody({ className, ...props }: DrawerBodyProps): JSX.Element {
  return <main className={cn("overflow-auto px-4 py-2", className)} data-slot="drawer-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

type DrawerFooterProps = ComponentProps<"div">;

function DrawerFooter({ className, ...props }: DrawerFooterProps): JSX.Element {
  return <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} data-slot="drawer-footer" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

type DrawerTitleProps = ComponentProps<typeof DrawerPrimitive.Title>;

function DrawerTitle({ className, ...props }: DrawerTitleProps): JSX.Element {
  return (
    <DrawerPrimitive.Title
      className={cn("text-foreground font-semibold", className)}
      data-slot="drawer-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

type DrawerDescriptionProps = ComponentProps<typeof DrawerPrimitive.Description>;

function DrawerDescription({ className, ...props }: DrawerDescriptionProps): JSX.Element {
  return (
    <DrawerPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="drawer-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

interface DrawerCloseProps extends ComponentProps<typeof DrawerPrimitive.Close> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

function DrawerClose({ className, size, variant = "outline", ...props }: DrawerCloseProps): JSX.Element {
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
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
};
export type {
  DrawerBodyProps,
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
  DrawerTitleProps,
  DrawerTriggerProps,
};
