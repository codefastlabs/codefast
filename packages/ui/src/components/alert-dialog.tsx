"use client";

import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { buttonVariants } from "@/components/button";
import { cn } from "@codefast/tailwind-variants";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

type AlertDialogProps = ComponentProps<typeof AlertDialogPrimitive.Root>;

function AlertDialog({ ...props }: AlertDialogProps): JSX.Element {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

type AlertDialogTriggerProps = ComponentProps<typeof AlertDialogPrimitive.Trigger>;

function AlertDialogTrigger({ ...props }: AlertDialogTriggerProps): JSX.Element {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

interface AlertDialogContentProps extends ComponentProps<typeof AlertDialogPrimitive.Content> {
  classNames?: {
    content?: string;
    overlay?: string;
    wrapper?: string;
  };
}

function AlertDialogContent({
  children,
  className,
  classNames,
  ...props
}: AlertDialogContentProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        className={cn(
          "data-[state=open]:fade-in-0 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:animate-out ease-ui fixed inset-0 z-50 bg-black/50",
          classNames?.overlay,
        )}
        data-slot="alert-dialog-overlay"
      />
      <AlertDialogPrimitive.Content
        className={cn(
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 ease-ui fixed inset-0 z-50 grid grid-rows-[1fr_auto_1fr] justify-items-center overflow-auto p-8 sm:grid-rows-[1fr_auto_3fr] sm:p-4",
          classNames?.wrapper,
        )}
        data-slot="alert-dialog-content-wrapper"
        {...props}
      >
        <div
          className={cn(
            "bg-popover text-popover-foreground relative row-start-2 flex w-full max-w-lg flex-col rounded-2xl border shadow-lg",
            classNames?.content,
            className,
          )}
          data-slot="alert-dialog-content"
        >
          {children}
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogHeader
 * -------------------------------------------------------------------------- */

type AlertDialogHeaderProps = ComponentProps<"div">;

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1.5 px-6 pt-6 pb-4 text-center sm:text-left",
        className,
      )}
      data-slot="alert-dialog-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

type AlertDialogBodyProps = ComponentProps<"div">;

function AlertDialogBody({ className, ...props }: AlertDialogBodyProps): JSX.Element {
  return (
    <main
      className={cn("overflow-auto px-6 py-2", className)}
      data-slot="alert-dialog-body"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

type AlertDialogFooterProps = ComponentProps<"div">;

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 px-6 pt-4 pb-6 sm:flex-row sm:justify-end",
        className,
      )}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTitle
 * -------------------------------------------------------------------------- */

type AlertDialogTitleProps = ComponentProps<typeof AlertDialogPrimitive.Title>;

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogDescription
 * -------------------------------------------------------------------------- */

type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogPrimitive.Description>;

function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

interface AlertDialogActionProps extends ComponentProps<typeof AlertDialogPrimitive.Action> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

function AlertDialogAction({
  className,
  size,
  variant,
  ...props
}: AlertDialogActionProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Action
      className={buttonVariants({ className, size, variant })}
      data-slot="alert-dialog-action"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogCancel
 * -------------------------------------------------------------------------- */

interface AlertDialogCancelProps extends ComponentProps<typeof AlertDialogPrimitive.Cancel> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

function AlertDialogCancel({
  className,
  size,
  variant = "outline",
  ...props
}: AlertDialogCancelProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Cancel
      className={buttonVariants({ className, size, variant })}
      data-slot="alert-dialog-cancel"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
};
export type {
  AlertDialogActionProps,
  AlertDialogBodyProps,
  AlertDialogCancelProps,
  AlertDialogContentProps,
  AlertDialogDescriptionProps,
  AlertDialogFooterProps,
  AlertDialogHeaderProps,
  AlertDialogProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps,
};
