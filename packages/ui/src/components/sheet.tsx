"use client";

import type { ButtonVariants } from "#/variants/button";
import { buttonVariants } from "#/variants/button";
import type { SheetContentVariants } from "#/variants/sheet";
import { sheetContentVariants } from "#/variants/sheet";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: Sheet
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetProps = ComponentProps<typeof SheetPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Sheet({ children, ...props }: SheetProps): JSX.Element {
  return (
    <SheetPrimitive.Root data-slot="sheet" {...props}>
      {children}
    </SheetPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetTriggerProps = ComponentProps<typeof SheetPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function SheetTrigger({ ...props }: SheetTriggerProps): JSX.Element {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SheetContentProps
  extends ComponentProps<typeof SheetPrimitive.Content>, SheetContentVariants {
  classNames?: {
    close?: string;
    content?: string;
    overlay?: string;
  };
}

/**
 * @since 0.3.16-canary.0
 */
function SheetContent({
  children,
  className,
  classNames,
  side = "right",
  ...props
}: SheetContentProps): JSX.Element {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50",
          "bg-black/40 backdrop-blur-sm",
          "ease-gentle data-open:animate-in data-open:animation-duration-380 data-open:fade-in-0",
          "data-closed:animate-out data-closed:animation-duration-280 data-closed:fade-out-0",
          "motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0",
          classNames?.overlay,
        )}
        data-slot="sheet-overlay"
      />
      <SheetPrimitive.Content
        className={sheetContentVariants({ className: [classNames?.content, className], side })}
        data-slot="sheet-content"
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className={buttonVariants({
            className: ["absolute top-4 right-4 size-7", classNames?.close],
            size: "icon",
            variant: "ghost",
          })}
          data-slot="sheet-close"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SheetHeader({ className, ...props }: SheetHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-col gap-1.5 px-6 pt-6 pb-4 text-center",
        "sm:text-left",
        className,
      )}
      data-slot="sheet-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetBody
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetBodyProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SheetBody({ className, ...props }: SheetBodyProps): JSX.Element {
  return (
    <main
      className={cn("overflow-auto", "px-6 py-2", className)}
      data-slot="sheet-body"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function SheetFooter({ className, ...props }: SheetFooterProps): JSX.Element {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 px-6 pt-4 pb-6",
        "sm:flex-row sm:justify-end",
        className,
      )}
      data-slot="sheet-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetTitleProps = ComponentProps<typeof SheetPrimitive.Title>;

/**
 * @since 0.3.16-canary.0
 */
function SheetTitle({ className, ...props }: SheetTitleProps): JSX.Element {
  return (
    <SheetPrimitive.Title
      className={cn("text-lg font-semibold text-foreground", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type SheetDescriptionProps = ComponentProps<typeof SheetPrimitive.Description>;

/**
 * @since 0.3.16-canary.0
 */
function SheetDescription({ className, ...props }: SheetDescriptionProps): JSX.Element {
  return (
    <SheetPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface SheetCloseProps extends ComponentProps<typeof SheetPrimitive.Close> {
  size?: ButtonVariants["size"];
  variant?: ButtonVariants["variant"];
}

/**
 * @since 0.3.16-canary.0
 */
function SheetClose({ className, size, variant, ...props }: SheetCloseProps): JSX.Element {
  return (
    <SheetPrimitive.Close
      className={buttonVariants({ className, size, variant })}
      data-slot="sheet-close"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
export type {
  SheetBodyProps,
  SheetCloseProps,
  SheetContentProps,
  SheetDescriptionProps,
  SheetFooterProps,
  SheetHeaderProps,
  SheetProps,
  SheetTitleProps,
  SheetTriggerProps,
};
