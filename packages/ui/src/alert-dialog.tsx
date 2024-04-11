"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { buttonVariants } from "./button";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

type AlertDialogProps = React.ComponentProps<typeof AlertDialogPrimitive.Root>;
const AlertDialog = AlertDialogPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

type AlertDialogTriggerProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Trigger>;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

type AlertDialogContentElement = React.ElementRef<typeof AlertDialogPrimitive.Content>;
type AlertDialogContentProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>;

const AlertDialogContent = React.forwardRef<AlertDialogContentElement, AlertDialogContentProps>(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-black/80" />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/3 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/3 animation-duration-200 fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg duration-200 focus:outline-none sm:rounded-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  ),
);

AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogHeader
 * -------------------------------------------------------------------------- */

type AlertDialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps): React.JSX.Element {
  return <div className={cn("flex flex-col space-y-2 text-center", "sm:text-left", className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

type AlertDialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps): React.JSX.Element {
  return <div className={cn("flex flex-col-reverse gap-2", "sm:flex-row sm:justify-end", className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTitle
 * -------------------------------------------------------------------------- */

type AlertDialogTitleElement = React.ElementRef<typeof AlertDialogPrimitive.Title>;
type AlertDialogTitleProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>;

const AlertDialogTitle = React.forwardRef<AlertDialogTitleElement, AlertDialogTitleProps>(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
  ),
);

AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogDescription
 * -------------------------------------------------------------------------- */

type AlertDialogDescriptionElement = React.ElementRef<typeof AlertDialogPrimitive.Description>;
type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>;

const AlertDialogDescription = React.forwardRef<AlertDialogDescriptionElement, AlertDialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />
  ),
);

AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

type AlertDialogActionElement = React.ElementRef<typeof AlertDialogPrimitive.Action>;
type AlertDialogActionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>;

const AlertDialogAction = React.forwardRef<AlertDialogActionElement, AlertDialogActionProps>(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Action ref={ref} className={buttonVariants({ className })} {...props} />
  ),
);

AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogCancel
 * -------------------------------------------------------------------------- */

type AlertDialogCancelElement = React.ElementRef<typeof AlertDialogPrimitive.Cancel>;
type AlertDialogCancelProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>;

const AlertDialogCancel = React.forwardRef<AlertDialogCancelElement, AlertDialogCancelProps>(
  ({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Cancel ref={ref} className={buttonVariants({ variant: "outline", className })} {...props} />
  ),
);
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  type AlertDialogProps,
  type AlertDialogTriggerProps,
  type AlertDialogContentProps,
  type AlertDialogHeaderProps,
  type AlertDialogFooterProps,
  type AlertDialogTitleProps,
  type AlertDialogDescriptionProps,
  type AlertDialogActionProps,
  type AlertDialogCancelProps,
};
