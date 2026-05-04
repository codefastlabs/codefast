"use client";

import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { buttonVariants } from "#/components/button";

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Dialog({ ...props }: DialogProps): JSX.Element {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function DialogTrigger({ ...props }: DialogTriggerProps): JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  classNames?: {
    close?: string;
    content?: string;
    overlay?: string;
    wrapper?: string;
  };
}

/**
 * @since 0.3.16-canary.0
 */
function DialogContent({
  children,
  className,
  classNames,
  ...props
}: DialogContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50",
          "bg-black/50",
          "ease-ui data-open:animate-in data-open:fade-in-0",
          "data-closed:animate-out data-closed:fade-out-0",
          classNames?.overlay,
        )}
        data-slot="dialog-overlay"
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-0 z-50 grid grid-rows-[1fr_auto] justify-items-center overflow-auto",
          "sm:grid-rows-[1fr_auto_3fr] sm:p-4",
          "ease-ui data-open:animate-in",
          "max-sm:data-open:animation-duration-500 max-sm:data-open:slide-in-from-bottom",
          "sm:data-open:fade-in-0 sm:data-open:zoom-in-95",
          "data-closed:animate-out",
          "max-sm:data-closed:animation-duration-500 max-sm:data-closed:slide-out-to-bottom",
          "sm:data-closed:fade-out-0 sm:data-closed:zoom-out-95",
          classNames?.wrapper,
        )}
        data-slot="dialog-content-wrapper"
        {...props}
      >
        <div
          className={cn(
            "relative row-start-2 flex w-full flex-col",
            "rounded-t-2xl border",
            "bg-popover text-popover-foreground shadow-lg",
            "sm:max-w-lg sm:rounded-2xl",
            classNames?.content,
            className,
          )}
          data-slot="dialog-content"
        >
          {children}
          <DialogPrimitive.Close
            className={buttonVariants({
              className: ["absolute top-2.5 right-2.5 size-7", classNames?.close],
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

/**
 * @since 0.3.16-canary.0
 */
type DialogHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DialogHeader({ className, ...props }: DialogHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-col gap-1.5 px-6 pt-6 pb-2 text-center",
        "sm:text-left",
        className,
      )}
      data-slot="dialog-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogBodyProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DialogBody({ className, ...props }: DialogBodyProps): JSX.Element {
  return (
    <main
      className={cn("overflow-auto", "px-6 py-2", className)}
      data-slot="dialog-body"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function DialogFooter({ className, ...props }: DialogFooterProps): JSX.Element {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 px-6 pt-2 pb-6",
        "sm:flex-row sm:justify-end",
        className,
      )}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;

/**
 * @since 0.3.16-canary.0
 */
function DialogTitle({ className, ...props }: DialogTitleProps): JSX.Element {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;

/**
 * @since 0.3.16-canary.0
 */
function DialogDescription({ className, ...props }: DialogDescriptionProps): JSX.Element {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface DialogCloseProps extends Omit<ComponentProps<typeof DialogPrimitive.Close>, "ref"> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

/**
 * @since 0.3.16-canary.0
 */
function DialogClose({
  className,
  size,
  variant = "outline",
  ...props
}: DialogCloseProps): JSX.Element {
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
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
};
