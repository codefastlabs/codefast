"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { type VariantProps } from "cva";
import { cn, cva } from "./utils";

/* -----------------------------------------------------------------------------
 * Variant: Sheet
 * -------------------------------------------------------------------------- */

const sheetVariants = cva({
  base: [
    "bg-background fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out",
    "data-[state=open]:animate-in data-[state=open]:duration-500",
    "data-[state=closed]:animate-out data-[state=closed]:duration-300",
  ],
  variants: {
    side: {
      top: [
        "inset-x-0 top-0 border-b",
        "data-[state=open]:slide-in-from-top",
        "data-[state=closed]:slide-out-to-top",
      ],
      bottom: [
        "inset-x-0 bottom-0 border-t",
        "data-[state=open]:slide-in-from-bottom",
        "data-[state=closed]:slide-out-to-bottom",
      ],
      left: [
        "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        "data-[state=open]:slide-in-from-left",
        "data-[state=closed]:slide-out-to-left",
      ],
      right: [
        "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
        "data-[state=open]:slide-in-from-right",
        "data-[state=closed]:slide-out-to-right",
      ],
    },
  },
  defaultVariants: {
    side: "right",
  },
});

/* -----------------------------------------------------------------------------
 * Component: Sheet
 * -------------------------------------------------------------------------- */

const Sheet = SheetPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SheetTrigger
 * -------------------------------------------------------------------------- */

const SheetTrigger = SheetPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

const SheetClose = SheetPrimitive.Close;

/* -----------------------------------------------------------------------------
 * Component: SheetPortal
 * -------------------------------------------------------------------------- */

const SheetPortal = SheetPrimitive.Portal;

/* -----------------------------------------------------------------------------
 * Component: SheetOverlay
 * -------------------------------------------------------------------------- */

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  SheetPrimitive.DialogOverlayProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetPrimitive.DialogContentProps & VariantProps<typeof sheetVariants>
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close
        className={cn(
          "ring-offset-background focus:ring-ring absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none",
          "data-[state=open]:bg-secondary",
        )}
      >
        <Cross2Icon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetHeader
 * -------------------------------------------------------------------------- */

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className,
      )}
      {...props}
    />
  );
}
SheetFooter.displayName = "SheetFooter";

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  SheetPrimitive.DialogTitleProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-foreground text-lg font-semibold", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  SheetPrimitive.DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
