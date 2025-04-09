import type { ComponentProps, JSX } from "react";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import type { VariantProps } from "@/lib/utils";

import { buttonVariants } from "@/components/button";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

function AlertDialog({ ...props }: ComponentProps<typeof AlertDialogPrimitive.Root>): JSX.Element {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

function AlertDialogTrigger({ ...props }: ComponentProps<typeof AlertDialogPrimitive.Trigger>): JSX.Element {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

function AlertDialogContent({
  children,
  className,
  classNames,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content> & {
  classNames?: {
    content?: string;
    overlay?: string;
    wrapper?: string;
  };
}): JSX.Element {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        className={cn(
          "bg-popover-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50",
          classNames?.overlay,
        )}
        data-slot="alert-dialog-overlay"
      />
      <AlertDialogPrimitive.Content
        className={cn(
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 fixed inset-0 z-50 grid grid-rows-[1fr_auto_1fr] justify-items-center overflow-auto p-8 sm:grid-rows-[1fr_auto_3fr] sm:p-4",
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

function AlertDialogHeader({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn("flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left", className)}
      data-slot="alert-dialog-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

function AlertDialogBody({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return <main className={cn("overflow-auto px-6 py-2", className)} data-slot="alert-dialog-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

function AlertDialogFooter({ className, ...props }: ComponentProps<"div">): JSX.Element {
  return (
    <div
      className={cn("flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end", className)}
      data-slot="alert-dialog-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTitle
 * -------------------------------------------------------------------------- */

function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>): JSX.Element {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      data-slot="alert-dialog-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogDescription
 * -------------------------------------------------------------------------- */

function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>): JSX.Element {
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

function AlertDialogAction({
  className,
  size,
  variant,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Action> & {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}): JSX.Element {
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

function AlertDialogCancel({
  className,
  size,
  variant = "outline",
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Cancel> & {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}): JSX.Element {
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
