import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { tv } from 'tailwind-variants';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: SheetContent
 * -------------------------------------------------------------------------- */

const sheetContentVariants = tv({
  base: 'bg-background animation-ease-in-out data-[state=open]:animate-in data-[state=open]:animation-duration-500 data-[state=closed]:animate-out data-[state=closed]:animation-duration-500 fixed z-50 flex flex-col overflow-auto shadow-lg',
  variants: {
    side: {
      bottom:
        'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full inset-x-0 bottom-0 max-h-screen border-t',
      left: 'data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
      right:
        'data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
      top: 'data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full inset-x-0 top-0 max-h-screen border-b',
    },
  },
  defaultVariants: {
    side: 'right',
  },
});

/* -----------------------------------------------------------------------------
 * Component: Sheet
 * -------------------------------------------------------------------------- */

function Sheet({ children, ...props }: ComponentProps<typeof SheetPrimitive.Root>): JSX.Element {
  return (
    <SheetPrimitive.Root data-slot="sheet" {...props}>
      {children}
    </SheetPrimitive.Root>
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetTrigger
 * -------------------------------------------------------------------------- */

function SheetTrigger({ ...props }: ComponentProps<typeof SheetPrimitive.Trigger>): JSX.Element {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetContent
 * -------------------------------------------------------------------------- */

function SheetContent({
  children,
  className,
  side = 'right',
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetContentVariants>): JSX.Element {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        className="bg-popover-overlay data-[state=open]:animate-fade-in data-[state=open]:animation-duration-500 data-[state=closed]:animate-fade-out data-[state=closed]:animation-duration-500 fixed inset-0 z-50"
        data-slot="sheet-overlay"
      />
      <SheetPrimitive.Content
        className={sheetContentVariants({ className, side })}
        data-slot="sheet-content"
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className={buttonVariants({ className: 'absolute right-4 top-4', icon: true, size: '2xs', variant: 'ghost' })}
          data-slot="sheet-close"
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

function SheetHeader({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <header
      className={cn('flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left', className)}
      data-slot="sheet-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetBody
 * -------------------------------------------------------------------------- */

function SheetBody({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <main className={cn('px-6 py-2', className)} data-slot="sheet-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: SheetFooter
 * -------------------------------------------------------------------------- */

function SheetFooter({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <footer
      className={cn('flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end', className)}
      data-slot="sheet-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetTitle
 * -------------------------------------------------------------------------- */

function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>): JSX.Element {
  return (
    <SheetPrimitive.Title
      className={cn('text-foreground text-lg font-semibold', className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetDescription
 * -------------------------------------------------------------------------- */

function SheetDescription({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>): JSX.Element {
  return (
    <SheetPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: SheetClose
 * -------------------------------------------------------------------------- */

function SheetClose({
  className,
  size,
  variant = 'outline',
  ...props
}: ComponentProps<typeof SheetPrimitive.Close> & {
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
}): JSX.Element {
  return (
    <SheetPrimitive.Close className={buttonVariants({ className, size, variant })} data-slot="sheet-close" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
