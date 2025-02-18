import type { ComponentProps, JSX } from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;
const Dialog = DialogPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
const DialogTrigger = DialogPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content>;

function DialogContent({ children, className, ...props }: DialogContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/80 p-4 sm:pb-12 sm:pt-8',
          'data-[state=open]:animation-duration-200 data-[state=open]:animate-fade-in',
          'data-[state=closed]:animation-duration-200 data-[state=closed]:animate-fade-out',
        )}
      >
        <DialogPrimitive.Content
          className={cn(
            'bg-background relative z-50 flex w-full max-w-lg flex-col rounded-lg border shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:animation-duration-200 data-[state=open]:fade-in',
            'data-[state=closed]:zoom-out-95 data-[state=closed]:animation-duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out',
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className={buttonVariants({
              className: 'absolute right-2.5 top-2.5',
              icon: true,
              size: 'xxs',
              variant: 'ghost',
            })}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogHeader
 * -------------------------------------------------------------------------- */

type DialogHeaderProps = ComponentProps<'div'>;

function DialogHeader({ className, ...props }: DialogHeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        'flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

type DialogBodyProps = ComponentProps<'div'>;

function DialogBody({ className, ...props }: DialogBodyProps): JSX.Element {
  return <main className={cn('overflow-auto px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

type DialogFooterProps = ComponentProps<'div'>;

function DialogFooter({ className, ...props }: DialogFooterProps): JSX.Element {
  return (
    <footer
      className={cn(
        'flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;

function DialogTitle({ className, ...props }: DialogTitleProps): JSX.Element {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;

function DialogDescription({ className, ...props }: DialogDescriptionProps): JSX.Element {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

interface DialogCloseProps extends ComponentProps<typeof DialogPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

function DialogClose({
  className,
  size,
  variant = 'outline',
  ...props
}: DialogCloseProps): JSX.Element {
  return (
    <DialogPrimitive.Close className={buttonVariants({ className, size, variant })} {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
