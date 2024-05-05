'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;
const Dialog = DialogPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

type DialogTriggerProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Trigger
>;
const DialogTrigger = DialogPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

type DialogCloseProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Close
>;
const DialogClose = DialogPrimitive.Close;

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

type DialogContentElement = React.ElementRef<typeof DialogPrimitive.Content>;
type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
>;

const DialogContent = React.forwardRef<
  DialogContentElement,
  DialogContentProps
>(({ children, className, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="data-[state=open]:animate-duration-200 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-black/80" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'bg-background data-[state=open]:animate-in data-[state=open]:animate-duration-200 data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none">
        <Cross2Icon className="size-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

DialogContent.displayName = DialogPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: DialogHeader
 * -------------------------------------------------------------------------- */

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function DialogHeader({
  className,
  ...props
}: DialogHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function DialogFooter({
  className,
  ...props
}: DialogFooterProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

type DialogTitleElement = React.ElementRef<typeof DialogPrimitive.Title>;
type DialogTitleProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Title
>;

const DialogTitle = React.forwardRef<DialogTitleElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  ),
);

DialogTitle.displayName = DialogPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

type DialogDescriptionElement = React.ElementRef<
  typeof DialogPrimitive.Description
>;
type DialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;

const DialogDescription = React.forwardRef<
  DialogDescriptionElement,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogProps,
  type DialogTriggerProps,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogFooterProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
};
