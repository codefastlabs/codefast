import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
} from 'react';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

type AlertDialogProps = ComponentProps<typeof AlertDialogPrimitive.Root>;
const AlertDialog = AlertDialogPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

type AlertDialogTriggerProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Trigger>;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

type AlertDialogContentElement = ComponentRef<typeof AlertDialogPrimitive.Content>;
type AlertDialogContentProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>;

const AlertDialogContent = forwardRef<AlertDialogContentElement, AlertDialogContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/80 p-4 sm:pb-12 sm:pt-8',
          'data-[state=open]:animate-duration-200 data-[state=open]:animate-fade-in',
          'data-[state=closed]:animate-duration-200 data-[state=closed]:animate-fade-out',
        )}
      >
        <AlertDialogPrimitive.Content
          ref={forwardedRef}
          className={cn(
            'bg-background relative z-50 flex w-full max-w-lg flex-col rounded-lg border shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:animate-duration-200 data-[state=open]:fade-in',
            'data-[state=closed]:zoom-out-95 data-[state=closed]:animate-duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out',
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

type AlertDialogHeaderProps = HTMLAttributes<HTMLDivElement>;

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps): JSX.Element {
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

type AlertDialogBodyProps = HTMLAttributes<HTMLDivElement>;

function AlertDialogBody({ className, ...props }: AlertDialogBodyProps): JSX.Element {
  return <main className={cn('overflow-auto px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

type AlertDialogFooterProps = HTMLAttributes<HTMLDivElement>;

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps): JSX.Element {
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

type AlertDialogTitleElement = ComponentRef<typeof AlertDialogPrimitive.Title>;
type AlertDialogTitleProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>;

const AlertDialogTitle = forwardRef<AlertDialogTitleElement, AlertDialogTitleProps>(
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

type AlertDialogDescriptionElement = ComponentRef<typeof AlertDialogPrimitive.Description>;
type AlertDialogDescriptionProps = ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>;

const AlertDialogDescription = forwardRef<AlertDialogDescriptionElement, AlertDialogDescriptionProps>(
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

type AlertDialogActionElement = ComponentRef<typeof AlertDialogPrimitive.Action>;
interface AlertDialogActionProps extends ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const AlertDialogAction = forwardRef<AlertDialogActionElement, AlertDialogActionProps>(
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

type AlertDialogCancelElement = ComponentRef<typeof AlertDialogPrimitive.Cancel>;
interface AlertDialogCancelProps extends ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const AlertDialogCancel = forwardRef<AlertDialogCancelElement, AlertDialogCancelProps>(
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
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogActionProps,
  type AlertDialogBodyProps,
  type AlertDialogCancelProps,
  type AlertDialogContentProps,
  type AlertDialogDescriptionProps,
  type AlertDialogFooterProps,
  type AlertDialogHeaderProps,
  type AlertDialogProps,
  type AlertDialogTitleProps,
  type AlertDialogTriggerProps,
};
