"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { buttonVariants } from "@/components/button";
import { cn } from "@/lib/utils";

import type { VariantProps } from "@/lib/utils";
import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;

function Dialog({ ...props }: DialogProps): JSX.Element {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;

function DialogTrigger({ ...props }: DialogTriggerProps): JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  classNames?: {
    close?: string;
    content?: string;
    overlay?: string;
    wrapper?: string;
  };
}

function DialogContent({ children, className, classNames, ...props }: DialogContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "bg-popover-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50",
          classNames?.overlay,
        )}
        data-slot="dialog-overlay"
      />
      <DialogPrimitive.Content
        className={cn(
          "data-[state=open]:animate-in max-sm:data-[state=open]:animation-duration-500 max-sm:data-[state=open]:slide-in-from-bottom sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 data-[state=closed]:animate-out max-sm:data-[state=closed]:animation-duration-500 max-sm:data-[state=closed]:slide-out-to-bottom sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 fixed inset-0 z-50 grid grid-rows-[1fr_auto] justify-items-center overflow-auto sm:grid-rows-[1fr_auto_3fr] sm:p-4",
          classNames?.wrapper,
        )}
        data-slot="dialog-content-wrapper"
        {...props}
      >
        <div
          className={cn(
            "bg-popover text-popover-foreground relative row-start-2 flex w-full flex-col rounded-t-2xl border shadow-lg sm:max-w-lg sm:rounded-2xl",
            classNames?.content,
            className,
          )}
          data-slot="dialog-content"
        >
          {children}
          <DialogPrimitive.Close
            className={buttonVariants({
              className: ["absolute right-2.5 top-2.5 size-7", classNames?.close],
              size: "icon",
              variant: "ghost",
            })}
            data-slot="dialog-close"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogHeader
 * -------------------------------------------------------------------------- */

type DialogHeaderProps = ComponentProps<"div">;

function DialogHeader({ className, ...props }: DialogHeaderProps): JSX.Element {
  return (
    <header
      className={cn("flex shrink-0 flex-col gap-1.5 px-6 pb-2 pt-6 text-center sm:text-left", className)}
      data-slot="dialog-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

type DialogBodyProps = ComponentProps<"div">;

function DialogBody({ className, ...props }: DialogBodyProps): JSX.Element {
  return <main className={cn("overflow-auto px-6 py-2", className)} data-slot="dialog-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

type DialogFooterProps = ComponentProps<"div">;

function DialogFooter({ className, ...props }: DialogFooterProps): JSX.Element {
  return (
    <footer
      className={cn("flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-2 sm:flex-row sm:justify-end", className)}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;

function DialogTitle({ className, ...props }: DialogTitleProps): JSX.Element {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;

function DialogDescription({ className, ...props }: DialogDescriptionProps): JSX.Element {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

interface DialogCloseProps extends Omit<ComponentProps<typeof DialogPrimitive.Close>, "ref"> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

function DialogClose({ className, size, variant = "outline", ...props }: DialogCloseProps): JSX.Element {
  return (
    <DialogPrimitive.Close
      className={buttonVariants({ className, size, variant })}
      data-slot="dialog-close"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
export type {
  DialogProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogBodyProps,
  DialogFooterProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
};
