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
  base: "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out animate-ease-in-out data-[state=open]:animate-duration-500 fixed z-50 gap-4 p-6 shadow-lg",
  variants: {
    side: {
      top: "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top inset-x-0 top-0 border-b",
      bottom:
        "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom inset-x-0 bottom-0 border-t",
      left: "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right:
        "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    },
  },
  defaultVariants: {
    side: "right",
  },
});

type SheetVariantsProps = VariantProps<typeof sheetVariants>;

/* -----------------------------------------------------------------------------
 * Component: Sheet
 * -------------------------------------------------------------------------- */

type SheetProps = React.ComponentProps<typeof SheetPrimitive.Root>;
const Sheet = SheetPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SheetTrigger
 * -------------------------------------------------------------------------- */

type SheetTriggerProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>;
const SheetTrigger = SheetPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

type SheetCloseProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>;
const SheetClose = SheetPrimitive.Close;

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

type SheetContentElement = React.ElementRef<typeof SheetPrimitive.Content>;
type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & SheetVariantsProps;

const SheetContent = React.forwardRef<SheetContentElement, SheetContentProps>(
  ({ children, side = "right", className, ...props }, ref) => (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-black/80" />
      <SheetPrimitive.Content ref={ref} className={sheetVariants({ side, className })} {...props}>
        {children}
        <SheetPrimitive.Close className="data-[state=open]:bg-secondary absolute right-4 top-4 rounded-sm opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none">
          <Cross2Icon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  ),
);

SheetContent.displayName = SheetPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetHeader
 * -------------------------------------------------------------------------- */

type SheetHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function SheetHeader({ className, ...props }: SheetHeaderProps): React.JSX.Element {
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

type SheetFooterProps = React.HTMLAttributes<HTMLDivElement>;

function SheetFooter({ className, ...props }: SheetFooterProps): React.JSX.Element {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />;
}

SheetFooter.displayName = "SheetFooter";

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

type SheetTitleElement = React.ElementRef<typeof SheetPrimitive.Title>;
type SheetTitleProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>;

const SheetTitle = React.forwardRef<SheetTitleElement, SheetTitleProps>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn("text-foreground text-lg font-semibold", className)} {...props} />
));

SheetTitle.displayName = SheetPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

type SheetDescriptionElement = React.ElementRef<typeof SheetPrimitive.Description>;
type SheetDescriptionProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>;

const SheetDescription = React.forwardRef<SheetDescriptionElement, SheetDescriptionProps>(
  ({ className, ...props }, ref) => (
    <SheetPrimitive.Description ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />
  ),
);

SheetDescription.displayName = SheetPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  type SheetProps,
  type SheetTriggerProps,
  type SheetCloseProps,
  type SheetContentProps,
  type SheetHeaderProps,
  type SheetFooterProps,
  type SheetTitleProps,
  type SheetDescriptionProps,
};
