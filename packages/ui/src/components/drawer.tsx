'use client';

import type { ComponentProps, JSX } from 'react';

import { Drawer as DrawerPrimitive } from 'vaul';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Drawer
 * -------------------------------------------------------------------------- */

function Drawer({ shouldScaleBackground = true, ...props }: ComponentProps<typeof DrawerPrimitive.Root>): JSX.Element {
  return <DrawerPrimitive.Root data-slot="drawer" shouldScaleBackground={shouldScaleBackground} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTrigger
 * -------------------------------------------------------------------------- */

function DrawerTrigger({ ...props }: ComponentProps<typeof DrawerPrimitive.Trigger>): JSX.Element {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

function DrawerContent({ children, className, ...props }: ComponentProps<typeof DrawerPrimitive.Content>): JSX.Element {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="bg-popover-overlay fixed inset-0 z-50" data-slot="drawer-overlay" />
      <DrawerPrimitive.Content
        className={cn(
          'bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl border',
          className,
        )}
        data-slot="drawer-content"
        {...props}
      >
        <div className="bg-muted mx-auto my-3 h-1.5 w-12 rounded-full" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerHeader
 * -------------------------------------------------------------------------- */

function DrawerHeader({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} data-slot="drawer-header" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerBody
 * -------------------------------------------------------------------------- */

function DrawerBody({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <main className={cn('overflow-auto px-4 py-2', className)} data-slot="drawer-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

function DrawerFooter({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('mt-auto flex flex-col-reverse gap-2 p-4', className)} data-slot="drawer-footer" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

function DrawerTitle({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Title>): JSX.Element {
  return (
    <DrawerPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      data-slot="drawer-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

function DrawerDescription({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Description>): JSX.Element {
  return (
    <DrawerPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="drawer-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

function DrawerClose({
  className,
  size,
  variant = 'outline',
  ...props
}: ComponentProps<typeof DrawerPrimitive.Close> & {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}): JSX.Element {
  return (
    <DrawerPrimitive.Close
      className={buttonVariants({ className, size, variant })}
      data-slot="drawer-close"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
};
