import type { ComponentProps, JSX } from 'react';

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: AlertDialog
 * -------------------------------------------------------------------------- */

type AlertDialogProps = ComponentProps<typeof AlertDialogPrimitive.Root>;
const AlertDialog = AlertDialogPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogTrigger
 * -------------------------------------------------------------------------- */

type AlertDialogTriggerProps = ComponentProps<typeof AlertDialogPrimitive.Trigger>;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: AlertDialogContent
 * -------------------------------------------------------------------------- */

type AlertDialogContentProps = ComponentProps<typeof AlertDialogPrimitive.Content>;

function AlertDialogContent({ children, className, ...props }: AlertDialogContentProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        className={cn(
          'bg-popover-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50',
        )}
      />
      <AlertDialogPrimitive.Content
        className={cn(
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 fixed inset-0 z-50 grid grid-rows-[1fr_auto_1fr] justify-items-center overflow-auto p-8 sm:grid-rows-[1fr_auto_3fr] sm:p-4',
          className,
        )}
        {...props}
      >
        <div className="bg-popover ring-border shadow-border relative row-start-2 flex w-full max-w-lg flex-col rounded-2xl shadow-lg ring">
          {children}
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogHeader
 * -------------------------------------------------------------------------- */

type AlertDialogHeaderProps = ComponentProps<'div'>;

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

type AlertDialogBodyProps = ComponentProps<'div'>;

function AlertDialogBody({ className, ...props }: AlertDialogBodyProps): JSX.Element {
  return <main className={cn('overflow-auto px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogFooter
 * -------------------------------------------------------------------------- */

type AlertDialogFooterProps = ComponentProps<'div'>;

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

type AlertDialogTitleProps = ComponentProps<typeof AlertDialogPrimitive.Title>;

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps): JSX.Element {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogDescription
 * -------------------------------------------------------------------------- */

type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogPrimitive.Description>;

function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps): JSX.Element {
  return <AlertDialogPrimitive.Description className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogAction
 * -------------------------------------------------------------------------- */

interface AlertDialogActionProps extends ComponentProps<typeof AlertDialogPrimitive.Action> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

function AlertDialogAction({ className, size, variant, ...props }: AlertDialogActionProps): JSX.Element {
  return <AlertDialogPrimitive.Action className={buttonVariants({ className, size, variant })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertDialogCancel
 * -------------------------------------------------------------------------- */

interface AlertDialogCancelProps extends ComponentProps<typeof AlertDialogPrimitive.Cancel> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

function AlertDialogCancel({ className, size, variant = 'outline', ...props }: AlertDialogCancelProps): JSX.Element {
  return <AlertDialogPrimitive.Cancel className={buttonVariants({ className, size, variant })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
