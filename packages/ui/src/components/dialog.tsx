'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';
import { dialogVariants } from '@/styles/dialog-variants';

/* -----------------------------------------------------------------------------
 * Variant: Dialog
 * -------------------------------------------------------------------------- */

const { overlay, content, header, body, footer, title, description } = dialogVariants();

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;
const Dialog = DialogPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;
const DialogTrigger = DialogPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

type DialogContentElement = React.ElementRef<typeof DialogPrimitive.Content>;
type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

const DialogContent = React.forwardRef<DialogContentElement, DialogContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlay()}>
        <DialogPrimitive.Content ref={forwardedRef} className={content({ className })} {...props}>
          {children}
          <DialogPrimitive.Close
            className={buttonVariants({
              size: 'xxs',
              shape: 'square',
              variant: 'ghost',
              className: 'absolute right-4 top-4',
            })}
          >
            <Cross2Icon className="size-4" />
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

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function DialogHeader({ className, ...props }: DialogHeaderProps): React.JSX.Element {
  return <header className={header({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

type DialogBodyProps = React.HTMLAttributes<HTMLDivElement>;

function DialogBody({ className, ...props }: DialogBodyProps): React.JSX.Element {
  return <main className={body({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function DialogFooter({ className, ...props }: DialogFooterProps): React.JSX.Element {
  return <footer className={footer({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

type DialogTitleElement = React.ElementRef<typeof DialogPrimitive.Title>;
type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

const DialogTitle = React.forwardRef<DialogTitleElement, DialogTitleProps>(({ className, ...props }, forwardedRef) => (
  <DialogPrimitive.Title ref={forwardedRef} className={title({ className })} {...props} />
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

type DialogDescriptionElement = React.ElementRef<typeof DialogPrimitive.Description>;
type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

const DialogDescription = React.forwardRef<DialogDescriptionElement, DialogDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <DialogPrimitive.Description ref={forwardedRef} className={description({ className })} {...props} />
  ),
);

DialogDescription.displayName = DialogPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

type DialogCloseElement = React.ElementRef<typeof DialogPrimitive.Close>;

interface DialogCloseProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const DialogClose = React.forwardRef<DialogCloseElement, DialogCloseProps>(
  ({ className, size, variant = 'outline', ...props }, forwardedRef) => (
    <DialogPrimitive.Close ref={forwardedRef} className={buttonVariants({ className, size, variant })} {...props} />
  ),
);

DialogClose.displayName = DialogPrimitive.Close.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogProps,
  type DialogTriggerProps,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogBodyProps,
  type DialogFooterProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
};
