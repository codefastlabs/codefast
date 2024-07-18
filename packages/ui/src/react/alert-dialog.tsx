'use client';

import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/react/button';

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
  ({ className, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="data-[state=open]:animate-duration-200 data-[state=closed]:animate-duration-200 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/80 p-4 sm:pb-12 sm:pt-8">
        <AlertDialogPrimitive.Content
          ref={forwardedRef}
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:animate-duration-200 data-[state=closed]:animate-duration-200 data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out relative z-50 flex w-full max-w-lg flex-col rounded-lg border shadow-lg',
            className,
          )}
          {...props}
        />
      </AlertDialogPrimitive.Overlay>
    </AlertDialogPrimitive.Portal>
  ),
);

AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogHeader
 * -------------------------------------------------------------------------- */

type AlertDialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn('flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

type AlertDialogBodyProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogBody({ className, ...props }: AlertDialogBodyProps): React.JSX.Element {
  return <main className={cn('overflow-auto px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

type AlertDialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps): React.JSX.Element {
  return (
    <div
      className={cn('flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTitle
 * -------------------------------------------------------------------------- */

type AlertDialogTitleElement = React.ElementRef<typeof AlertDialogPrimitive.Title>;
type AlertDialogTitleProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>;

const AlertDialogTitle = React.forwardRef<AlertDialogTitleElement, AlertDialogTitleProps>(
  ({ className, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Title
      ref={forwardedRef}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
);

AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogDescription
 * -------------------------------------------------------------------------- */

type AlertDialogDescriptionElement = React.ElementRef<typeof AlertDialogPrimitive.Description>;
type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>;

const AlertDialogDescription = React.forwardRef<AlertDialogDescriptionElement, AlertDialogDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Description
      ref={forwardedRef}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  ),
);

AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

type AlertDialogActionElement = React.ElementRef<typeof AlertDialogPrimitive.Action>;
type AlertDialogActionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>;

const AlertDialogAction = React.forwardRef<AlertDialogActionElement, AlertDialogActionProps>(
  ({ className, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Action ref={forwardedRef} className={buttonVariants({ className })} {...props} />
  ),
);

AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogCancel
 * -------------------------------------------------------------------------- */

type AlertDialogCancelElement = React.ElementRef<typeof AlertDialogPrimitive.Cancel>;
type AlertDialogCancelProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>;

const AlertDialogCancel = React.forwardRef<AlertDialogCancelElement, AlertDialogCancelProps>(
  ({ className, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Cancel
      ref={forwardedRef}
      className={buttonVariants({ variant: 'outline', className })}
      {...props}
    />
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
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  type AlertDialogProps,
  type AlertDialogTriggerProps,
  type AlertDialogContentProps,
  type AlertDialogHeaderProps,
  type AlertDialogBodyProps,
  type AlertDialogFooterProps,
  type AlertDialogTitleProps,
  type AlertDialogDescriptionProps,
  type AlertDialogActionProps,
  type AlertDialogCancelProps,
};
