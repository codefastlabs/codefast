import type { ComponentProps, ComponentPropsWithoutRef, ComponentRef, HTMLAttributes, JSX } from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { forwardRef } from 'react';

import type { ButtonVariantsProps } from '@/styles/button-variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;
const Dialog = DialogPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

type DialogTriggerProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;
const DialogTrigger = DialogPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

type DialogContentElement = ComponentRef<typeof DialogPrimitive.Content>;
type DialogContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

const DialogContent = forwardRef<DialogContentElement, DialogContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 grid place-items-center overflow-auto bg-black/80 p-4 sm:pb-12 sm:pt-8',
          'data-[state=open]:animate-duration-200 data-[state=open]:animate-fade-in',
          'data-[state=closed]:animate-duration-200 data-[state=closed]:animate-fade-out',
        )}
      >
        <DialogPrimitive.Content
          ref={forwardedRef}
          className={cn(
            'bg-background relative z-50 flex w-full max-w-lg flex-col rounded-lg border shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:animate-duration-200 data-[state=open]:fade-in',
            'data-[state=closed]:zoom-out-95 data-[state=closed]:animate-duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out',
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className={buttonVariants({
              className: 'absolute right-4 top-4',
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
  ),
);

DialogContent.displayName = DialogPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: DialogHeader
 * -------------------------------------------------------------------------- */

type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;

function DialogHeader({ className, ...props }: DialogHeaderProps): JSX.Element {
  return (
    <header
      className={cn('flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

type DialogBodyProps = HTMLAttributes<HTMLDivElement>;

function DialogBody({ className, ...props }: DialogBodyProps): JSX.Element {
  return <main className={cn('overflow-auto px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

function DialogFooter({ className, ...props }: DialogFooterProps): JSX.Element {
  return (
    <footer
      className={cn('flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

type DialogTitleElement = ComponentRef<typeof DialogPrimitive.Title>;
type DialogTitleProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

const DialogTitle = forwardRef<DialogTitleElement, DialogTitleProps>(({ className, ...props }, forwardedRef) => (
  <DialogPrimitive.Title
    ref={forwardedRef}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

type DialogDescriptionElement = ComponentRef<typeof DialogPrimitive.Description>;
type DialogDescriptionProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

const DialogDescription = forwardRef<DialogDescriptionElement, DialogDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <DialogPrimitive.Description
      ref={forwardedRef}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  ),
);

DialogDescription.displayName = DialogPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

type DialogCloseElement = ComponentRef<typeof DialogPrimitive.Close>;
interface DialogCloseProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const DialogClose = forwardRef<DialogCloseElement, DialogCloseProps>(
  ({ className, size, variant = 'outline', ...props }, forwardedRef) => (
    <DialogPrimitive.Close ref={forwardedRef} className={buttonVariants({ className, size, variant })} {...props} />
  ),
);

DialogClose.displayName = DialogPrimitive.Close.displayName;

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
