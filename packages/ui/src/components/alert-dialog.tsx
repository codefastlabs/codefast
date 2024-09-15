'use client';

import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';
import { alertDialogVariants } from '@/styles/alert-dialog-variants';

/* -----------------------------------------------------------------------------
 * Variant: AlertDialog
 * -------------------------------------------------------------------------- */

const { overlay, content, header, body, footer, title, description } = alertDialogVariants();

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
      <AlertDialogPrimitive.Overlay className={overlay()}>
        <AlertDialogPrimitive.Content ref={forwardedRef} className={content({ className })} {...props} />
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
  return <div className={header({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

type AlertDialogBodyProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogBody({ className, ...props }: AlertDialogBodyProps): React.JSX.Element {
  return <main className={body({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

type AlertDialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps): React.JSX.Element {
  return <div className={footer({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTitle
 * -------------------------------------------------------------------------- */

type AlertDialogTitleElement = React.ElementRef<typeof AlertDialogPrimitive.Title>;
type AlertDialogTitleProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>;

const AlertDialogTitle = React.forwardRef<AlertDialogTitleElement, AlertDialogTitleProps>(
  ({ className, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Title ref={forwardedRef} className={title({ className })} {...props} />
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
    <AlertDialogPrimitive.Description ref={forwardedRef} className={description({ className })} {...props} />
  ),
);

AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

type AlertDialogActionElement = React.ElementRef<typeof AlertDialogPrimitive.Action>;

interface AlertDialogActionProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const AlertDialogAction = React.forwardRef<AlertDialogActionElement, AlertDialogActionProps>(
  ({ className, size, variant, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Action
      ref={forwardedRef}
      className={buttonVariants({ className, size, variant })}
      {...props}
    />
  ),
);

AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogCancel
 * -------------------------------------------------------------------------- */

type AlertDialogCancelElement = React.ElementRef<typeof AlertDialogPrimitive.Cancel>;

interface AlertDialogCancelProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const AlertDialogCancel = React.forwardRef<AlertDialogCancelElement, AlertDialogCancelProps>(
  ({ className, size, variant = 'outline', ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Cancel
      ref={forwardedRef}
      className={buttonVariants({ className, size, variant })}
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
