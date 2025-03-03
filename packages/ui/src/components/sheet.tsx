import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { tv } from 'tailwind-variants';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

const sheetContentVariants = tv({
  base: 'bg-background animation-ease-in-out data-[state=open]:animate-in data-[state=open]:animation-duration-500 data-[state=closed]:animate-out data-[state=closed]:animation-duration-500 fixed z-50 flex flex-col overflow-auto shadow-lg',
  variants: {
    side: {
      bottom:
        'data-[state=open]:slide-from-b-full data-[state=closed]:slide-to-b-full inset-x-0 bottom-0 max-h-screen border-t',
      left: 'data-[state=open]:slide-from-l-full data-[state=closed]:slide-to-l-full inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
      right:
        'data-[state=open]:slide-from-r-full data-[state=closed]:slide-to-r-full inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
      top: 'data-[state=open]:slide-from-t-full data-[state=closed]:slide-to-t-full inset-x-0 top-0 max-h-screen border-b',
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

type SheetProps = ComponentProps<typeof SheetPrimitive.Root>;
const Sheet = SheetPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: SheetTrigger
 * -------------------------------------------------------------------------- */

type SheetTriggerProps = ComponentProps<typeof SheetPrimitive.Trigger>;
const SheetTrigger = SheetPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

type SheetContentProps = ComponentProps<typeof SheetPrimitive.Content> & SheetContentVariantsProps;

function SheetContent({ children, className, side = 'right', ...props }: SheetContentProps): JSX.Element {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="bg-popover-overlay data-[state=open]:animate-fade-in data-[state=open]:animation-duration-500 data-[state=closed]:animate-fade-out data-[state=closed]:animation-duration-500 fixed inset-0 z-50" />
      <SheetPrimitive.Content className={sheetContentVariants({ className, side })} {...props}>
        {children}
        <SheetPrimitive.Close
          className={buttonVariants({
            className: 'absolute right-4 top-4',
            icon: true,
            size: '2xs',
            variant: 'ghost',
          })}
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetHeader
 * -------------------------------------------------------------------------- */

type SheetHeaderProps = ComponentProps<'div'>;

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

type SheetBodyProps = ComponentProps<'div'>;

function SheetBody({ className, ...props }: SheetHeaderProps): JSX.Element {
  return <main className={cn('px-6 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

type SheetFooterProps = ComponentProps<'div'>;

function SheetFooter({ className, ...props }: SheetFooterProps): JSX.Element {
  return (
    <footer
      className={cn('flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

type SheetTitleProps = ComponentProps<typeof SheetPrimitive.Title>;

function SheetTitle({ className, ...props }: SheetTitleProps): JSX.Element {
  return <SheetPrimitive.Title className={cn('text-foreground text-lg font-semibold', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

type SheetDescriptionProps = ComponentProps<typeof SheetPrimitive.Description>;

function SheetDescription({ className, ...props }: SheetDescriptionProps): JSX.Element {
  return <SheetPrimitive.Description className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

interface SheetCloseProps extends ComponentProps<typeof SheetPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

function SheetClose({ className, size, variant = 'outline', ...props }: SheetCloseProps): JSX.Element {
  return <SheetPrimitive.Close className={buttonVariants({ className, size, variant })} {...props} />;
}

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
