"use client";

import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { buttonVariants } from "#/components/button";

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogProps = ComponentProps<typeof AlertDialogPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialog({ ...props }: AlertDialogProps): JSX.Element {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogTriggerProps = ComponentProps<typeof AlertDialogPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogTrigger({ ...props }: AlertDialogTriggerProps): JSX.Element {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface AlertDialogContentProps extends ComponentProps<typeof AlertDialogPrimitive.Content> {
  classNames?: {
    content?: string;
    overlay?: string;
    wrapper?: string;
  };
}

/**
 * @since 0.3.16-canary.0
 */
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
          "fixed inset-0 z-50",
          "bg-black/50",
          "ease-ui data-open:animate-in data-open:fade-in-0",
          "data-closed:animate-out data-closed:fade-out-0",
          classNames?.overlay,
        )}
        data-slot="alert-dialog-overlay"
      />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed inset-0 z-50 grid grid-rows-[1fr_auto_1fr] justify-items-center overflow-auto p-8",
          "sm:grid-rows-[1fr_auto_3fr] sm:p-4",
          "ease-ui data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          classNames?.wrapper,
        )}
        data-slot="alert-dialog-content-wrapper"
        {...props}
      >
        <div
          className={cn(
            "relative row-start-2 flex w-full max-w-lg flex-col",
            "rounded-2xl border",
            "bg-popover text-popover-foreground shadow-lg",
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

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1.5 px-6 pt-6 pb-4 text-center",
        "sm:text-left",
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

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogBodyProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogBody({ className, ...props }: AlertDialogBodyProps): JSX.Element {
  return (
    <main
      className={cn("overflow-auto", "px-6 py-2", className)}
      data-slot="alert-dialog-body"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 px-6 pt-4 pb-6",
        "sm:flex-row sm:justify-end",
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

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogTitleProps = ComponentProps<typeof AlertDialogPrimitive.Title>;

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogPrimitive.Description>;

/**
 * @since 0.3.16-canary.0
 */
function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface AlertDialogActionProps extends ComponentProps<typeof AlertDialogPrimitive.Action> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
interface AlertDialogCancelProps extends ComponentProps<typeof AlertDialogPrimitive.Cancel> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

/**
 * @since 0.3.16-canary.0
 */
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
