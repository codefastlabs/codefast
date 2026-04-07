"use client";

import { cn, tv } from "#utils/tv";
import type { VariantProps } from "#utils/tv";
import type { ComponentProps, JSX } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { buttonVariants } from "#components/button";

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

const sheetContentVariants = tv({
  base: [
    "fixed z-50 flex flex-col overflow-auto",
    "bg-background shadow-lg",
    "ease-emphasis data-[state=closed]:animate-out data-[state=closed]:animation-duration-500 data-[state=open]:animate-in data-[state=open]:animation-duration-500",
  ],
  defaultVariants: {
    side: "right",
  },
  variants: {
    side: {
      bottom:
        "inset-x-0 bottom-0 max-h-[80vh] border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
      right:
        "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      top: "inset-x-0 top-0 max-h-[80vh] border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: Sheet
 * -------------------------------------------------------------------------- */

type SheetProps = ComponentProps<typeof SheetPrimitive.Root>;

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

type SheetTriggerProps = ComponentProps<typeof SheetPrimitive.Trigger>;

function SheetTrigger({ ...props }: SheetTriggerProps): JSX.Element {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

interface SheetContentProps
  extends ComponentProps<typeof SheetPrimitive.Content>, VariantProps<typeof sheetContentVariants> {
  classNames?: {
    close?: string;
    content?: string;
    overlay?: string;
  };
}

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
          "bg-black/50",
          "ease-emphasis",
          "data-[state=closed]:animate-out data-[state=closed]:animation-duration-500 data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:animation-duration-500 data-[state=open]:fade-in-0",
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
            className: ["absolute top-4 right-4", "size-7", classNames?.close],
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

type SheetHeaderProps = ComponentProps<"div">;

function SheetHeader({ className, ...props }: SheetHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-col",
        "gap-1.5",
        "px-6 pt-6 pb-4",
        "text-center sm:text-left",
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

type SheetBodyProps = ComponentProps<"div">;

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

type SheetFooterProps = ComponentProps<"div">;

function SheetFooter({ className, ...props }: SheetFooterProps): JSX.Element {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col-reverse sm:flex-row sm:justify-end",
        "gap-2",
        "px-6 pt-4 pb-6",
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

type SheetTitleProps = ComponentProps<typeof SheetPrimitive.Title>;

function SheetTitle({ className, ...props }: SheetTitleProps): JSX.Element {
  return (
    <SheetPrimitive.Title
      className={cn("text-lg font-semibold", "text-foreground", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

type SheetDescriptionProps = ComponentProps<typeof SheetPrimitive.Description>;

function SheetDescription({ className, ...props }: SheetDescriptionProps): JSX.Element {
  return (
    <SheetPrimitive.Description
      className={cn("text-sm", "text-muted-foreground", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

interface SheetCloseProps extends ComponentProps<typeof SheetPrimitive.Close> {
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

function SheetClose({
  className,
  size,
  variant = "outline",
  ...props
}: SheetCloseProps): JSX.Element {
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

export { sheetContentVariants };
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
