'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';
import { sheetVariants, type SheetVariantsProps } from '@/styles/sheet-variants';

/* -----------------------------------------------------------------------------
 * Variant: Sheet
 * -------------------------------------------------------------------------- */

const { overlay, content, header, body, footer, title, description } = sheetVariants();

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
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

type SheetContentElement = React.ElementRef<typeof SheetPrimitive.Content>;
type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> &
  Pick<SheetVariantsProps, 'side'>;

const SheetContent = React.forwardRef<SheetContentElement, SheetContentProps>(
  ({ children, side, className, ...props }, forwardedRef) => (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className={overlay()} />
      <SheetPrimitive.Content ref={forwardedRef} className={content({ side, className })} {...props}>
        {children}
        <SheetPrimitive.Close
          className={buttonVariants({
            size: 'xxs',
            shape: 'square',
            variant: 'ghost',
            className: 'absolute right-4 top-4',
          })}
        >
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
  return <header className={header({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetBody
 * -------------------------------------------------------------------------- */

type SheetBodyProps = React.HTMLAttributes<HTMLDivElement>;

function SheetBody({ className, ...props }: SheetHeaderProps): React.JSX.Element {
  return <main className={body({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

type SheetFooterProps = React.HTMLAttributes<HTMLDivElement>;

function SheetFooter({ className, ...props }: SheetFooterProps): React.JSX.Element {
  return <footer className={footer({ className })} {...props} />;
}

SheetFooter.displayName = 'SheetFooter';

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

type SheetTitleElement = React.ElementRef<typeof SheetPrimitive.Title>;
type SheetTitleProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>;

const SheetTitle = React.forwardRef<SheetTitleElement, SheetTitleProps>(({ className, ...props }, forwardedRef) => (
  <SheetPrimitive.Title ref={forwardedRef} className={title({ className })} {...props} />
));

SheetTitle.displayName = SheetPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

type SheetDescriptionElement = React.ElementRef<typeof SheetPrimitive.Description>;
type SheetDescriptionProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>;

const SheetDescription = React.forwardRef<SheetDescriptionElement, SheetDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <SheetPrimitive.Description ref={forwardedRef} className={description({ className })} {...props} />
  ),
);

SheetDescription.displayName = SheetPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

type SheetCloseElement = React.ElementRef<typeof SheetPrimitive.Close>;

interface SheetCloseProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const SheetClose = React.forwardRef<SheetCloseElement, SheetCloseProps>(
  ({ className, size, variant = 'outline', ...props }, forwardedRef) => (
    <SheetPrimitive.Close ref={forwardedRef} className={buttonVariants({ variant, size, className })} {...props} />
  ),
);

SheetClose.displayName = SheetPrimitive.Close.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  type SheetProps,
  type SheetTriggerProps,
  type SheetCloseProps,
  type SheetContentProps,
  type SheetHeaderProps,
  type SheetBodyProps,
  type SheetFooterProps,
  type SheetTitleProps,
  type SheetDescriptionProps,
};
