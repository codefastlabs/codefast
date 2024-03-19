"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Drawer
 * -------------------------------------------------------------------------- */

function Drawer({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>): React.JSX.Element {
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTrigger
 * -------------------------------------------------------------------------- */

const DrawerTrigger = DrawerPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DrawerPortal
 * -------------------------------------------------------------------------- */

const DrawerPortal = DrawerPrimitive.Portal;

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

const DrawerClose = DrawerPrimitive.Close;

/* -----------------------------------------------------------------------------
 * Component: DrawerOverlay
 * -------------------------------------------------------------------------- */

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

/* -----------------------------------------------------------------------------
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border",
        className,
      )}
      {...props}
    >
      <div className="bg-muted mx-auto mt-4 h-2 w-[100px] rounded-full" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

/* -----------------------------------------------------------------------------
 * Component: DrawerHeader
 * -------------------------------------------------------------------------- */

function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
