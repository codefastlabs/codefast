import type { ComponentProps, ComponentPropsWithoutRef, ComponentRef, HTMLAttributes, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { tv } from 'tailwind-variants';

import type { ButtonVariantsProps } from '@/styles/button-variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

const sheetContentVariants = tv({
  base: [
    'bg-background animate-ease-in-out fixed z-50 flex flex-col overflow-auto shadow-lg',
    'data-[state=open]:animate-in data-[state=open]:animate-duration-500',
    'data-[state=closed]:animate-out data-[state=closed]:animate-duration-300',
  ],
  defaultVariants: {
    side: 'right',
  },
  variants: {
    side: {
      bottom: [
        'inset-x-0 bottom-0 max-h-screen border-t',
        'data-[state=open]:slide-in-from-bottom',
        'data-[state=closed]:slide-out-to-bottom',
      ],
      left: [
        'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
        'data-[state=open]:slide-in-from-left',
        'data-[state=closed]:slide-out-to-left',
      ],
      right: [
        'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
        'data-[state=open]:slide-in-from-right',
        'data-[state=closed]:slide-out-to-right',
      ],
      top: [
        'inset-x-0 top-0 max-h-screen border-b',
        'data-[state=open]:slide-in-from-top',
        'data-[state=closed]:slide-out-to-top',
      ],
    },
  },
});

type SheetContentVariantsProps = VariantProps<typeof sheetContentVariants>;

/* -----------------------------------------------------------------------------
 * Component: Sheet
 * -------------------------------------------------------------------------- */

type SheetProps = ComponentProps<typeof SheetPrimitive.Root>;
const Sheet = SheetPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SheetTrigger
 * -------------------------------------------------------------------------- */

type SheetTriggerProps = ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>;
const SheetTrigger = SheetPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

type SheetContentElement = ComponentRef<typeof SheetPrimitive.Content>;
type SheetContentProps = ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & SheetContentVariantsProps;

const SheetContent = forwardRef<SheetContentElement, SheetContentProps>(
  ({ children, className, side = 'right', ...props }, forwardedRef) => (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-black/80',
          'data-[state=open]:animate-duration-500 data-[state=open]:animate-fade-in',
          'data-[state=closed]:animate-duration-300 data-[state=closed]:animate-fade-out',
        )}
      />
      <SheetPrimitive.Content ref={forwardedRef} className={sheetContentVariants({ className, side })} {...props}>
        {children}
        <SheetPrimitive.Close
          className={buttonVariants({
            className: 'absolute right-4 top-4',
            icon: true,
            size: 'xxs',
            variant: 'ghost',
          })}
        >
          <XIcon className="size-4" />
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

type SheetHeaderProps = HTMLAttributes<HTMLDivElement>;

function SheetHeader({ className, ...props }: SheetHeaderProps): JSX.Element {
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

type SheetBodyProps = HTMLAttributes<HTMLDivElement>;

function SheetBody({ className, ...props }: SheetHeaderProps): JSX.Element {
  return <main className={cn('px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

type SheetFooterProps = HTMLAttributes<HTMLDivElement>;

function SheetFooter({ className, ...props }: SheetFooterProps): JSX.Element {
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

type SheetTitleElement = ComponentRef<typeof SheetPrimitive.Title>;
type SheetTitleProps = ComponentPropsWithoutRef<typeof SheetPrimitive.Title>;

const SheetTitle = forwardRef<SheetTitleElement, SheetTitleProps>(({ className, ...props }, forwardedRef) => (
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

type SheetDescriptionElement = ComponentRef<typeof SheetPrimitive.Description>;
type SheetDescriptionProps = ComponentPropsWithoutRef<typeof SheetPrimitive.Description>;

const SheetDescription = forwardRef<SheetDescriptionElement, SheetDescriptionProps>(
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

type SheetCloseElement = ComponentRef<typeof SheetPrimitive.Close>;
interface SheetCloseProps extends ComponentPropsWithoutRef<typeof SheetPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const SheetClose = forwardRef<SheetCloseElement, SheetCloseProps>(
  ({ className, size, variant = 'outline', ...props }, forwardedRef) => (
    <SheetPrimitive.Close ref={forwardedRef} className={buttonVariants({ className, size, variant })} {...props} />
  ),
);

SheetClose.displayName = SheetPrimitive.Close.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  SheetBodyProps,
  SheetCloseProps,
  SheetContentProps,
  SheetDescriptionProps,
  SheetFooterProps,
  SheetHeaderProps,
  SheetProps,
  SheetTitleProps,
  SheetTriggerProps,
};
export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
