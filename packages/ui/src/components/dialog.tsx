import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Dialog
 * -------------------------------------------------------------------------- */

function Dialog({ ...props }: ComponentProps<typeof DialogPrimitive.Root>): JSX.Element {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogTrigger
 * -------------------------------------------------------------------------- */

function DialogTrigger({ ...props }: ComponentProps<typeof DialogPrimitive.Trigger>): JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogContent
 * -------------------------------------------------------------------------- */

function DialogContent({ children, className, ...props }: ComponentProps<typeof DialogPrimitive.Content>): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="bg-popover-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50"
        data-slot="dialog-overlay"
      />
      <DialogPrimitive.Content
        className="data-[state=open]:animate-in max-sm:data-[state=open]:animation-duration-500 max-sm:data-[state=open]:slide-from-b-full sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 data-[state=closed]:animate-out max-sm:data-[state=closed]:animation-duration-500 max-sm:data-[state=closed]:slide-to-b-full sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 fixed inset-0 z-50 grid grid-rows-[1fr_auto] justify-items-center overflow-auto sm:grid-rows-[1fr_auto_3fr] sm:p-4"
        data-slot="dialog-content-wrapper"
        {...props}
      >
        <div
          className={cn(
            'bg-popover text-popover-foreground relative row-start-2 flex w-full flex-col rounded-t-2xl border shadow-lg sm:max-w-lg sm:rounded-2xl',
            className,
          )}
          data-slot="dialog-content"
        >
          {children}
          <DialogPrimitive.Close
            className={buttonVariants({
              className: 'absolute right-2.5 top-2.5',
              icon: true,
              size: '2xs',
              variant: 'ghost',
            })}
            data-slot="dialog-close"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogHeader
 * -------------------------------------------------------------------------- */

function DialogHeader({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <header
      className={cn('flex shrink-0 flex-col gap-1.5 px-6 pb-4 pt-6 text-center sm:text-left', className)}
      data-slot="dialog-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogBody
 * -------------------------------------------------------------------------- */

function DialogBody({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <main className={cn('overflow-auto px-6 py-2', className)} data-slot="dialog-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DialogFooter
 * -------------------------------------------------------------------------- */

function DialogFooter({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <footer
      className={cn('flex shrink-0 flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end', className)}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogTitle
 * -------------------------------------------------------------------------- */

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>): JSX.Element {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogDescription
 * -------------------------------------------------------------------------- */

function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>): JSX.Element {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DialogClose
 * -------------------------------------------------------------------------- */

function DialogClose({
  className,
  size,
  variant = 'outline',
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Close>, 'ref'> & {
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
}): JSX.Element {
  return (
    <DialogPrimitive.Close
      className={buttonVariants({ className, size, variant })}
      data-slot="dialog-close"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
