'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

const sheetContentVariants = tv({
  base: 'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:animate-duration-300 data-[state=open]:animate-duration-500 animate-ease-in-out fixed z-50 flex flex-col overflow-auto shadow-lg',
  variants: {
    side: {
      top: 'data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top inset-x-0 top-0 max-h-screen border-b',
      bottom:
        'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom inset-x-0 bottom-0 max-h-screen border-t',
      left: 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
      right:
        'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
    },
  },
  defaultVariants: {
    side: 'right',
  },
});

type SheetContentVariantsProps = VariantProps<typeof sheetContentVariants>;

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
type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & SheetContentVariantsProps;

const SheetContent = React.forwardRef<SheetContentElement, SheetContentProps>(
  ({ children, side = 'right', className, ...props }, forwardedRef) => (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="data-[state=closed]:animate-duration-300 data-[state=open]:animate-duration-500 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 bg-black/80" />
      <SheetPrimitive.Content ref={forwardedRef} className={sheetContentVariants({ side, className })} {...props}>
        {children}
        <SheetPrimitive.Close
          className={buttonVariants({
            className: 'absolute right-4 top-4',
            icon: true,
            size: 'xxs',
            variant: 'ghost',
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
  return (
    <header
      className={cn('flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetBody
 * -------------------------------------------------------------------------- */

type SheetBodyProps = React.HTMLAttributes<HTMLDivElement>;

function SheetBody({ className, ...props }: SheetHeaderProps): React.JSX.Element {
  return <main className={cn('px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

type SheetFooterProps = React.HTMLAttributes<HTMLDivElement>;

function SheetFooter({ className, ...props }: SheetFooterProps): React.JSX.Element {
  return (
    <footer
      className={cn('flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

SheetFooter.displayName = 'SheetFooter';

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

type SheetTitleElement = React.ElementRef<typeof SheetPrimitive.Title>;
type SheetTitleProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>;

const SheetTitle = React.forwardRef<SheetTitleElement, SheetTitleProps>(({ className, ...props }, forwardedRef) => (
  <SheetPrimitive.Title
    ref={forwardedRef}
    className={cn('text-foreground text-lg font-semibold', className)}
    {...props}
  />
));

SheetTitle.displayName = SheetPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

type SheetDescriptionElement = React.ElementRef<typeof SheetPrimitive.Description>;
type SheetDescriptionProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>;

const SheetDescription = React.forwardRef<SheetDescriptionElement, SheetDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <SheetPrimitive.Description
      ref={forwardedRef}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
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
