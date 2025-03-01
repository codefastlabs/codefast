'use client';

import type { ComponentProps, JSX } from 'react';

import { Drawer as DrawerPrimitive } from 'vaul';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Drawer
 * -------------------------------------------------------------------------- */

type DrawerProps = ComponentProps<typeof DrawerPrimitive.Root>;

function Drawer({ shouldScaleBackground = true, ...props }: DrawerProps): JSX.Element {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTrigger
 * -------------------------------------------------------------------------- */

type DrawerTriggerProps = ComponentProps<typeof DrawerPrimitive.Trigger>;
const DrawerTrigger = DrawerPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

type DrawerContentProps = ComponentProps<typeof DrawerPrimitive.Content>;

function DrawerContent({ children, className, ...props }: DrawerContentProps): JSX.Element {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="bg-popover-overlay fixed inset-0 z-50" />
      <DrawerPrimitive.Content
        className={cn(
          'bg-background ring-border fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl ring',
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 h-2 w-24 rounded-full" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerHeader
 * -------------------------------------------------------------------------- */

type DrawerHeaderProps = ComponentProps<'div'>;

function DrawerHeader({ className, ...props }: DrawerHeaderProps): JSX.Element {
  return <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerBody
 * -------------------------------------------------------------------------- */

type DrawerBodyProps = ComponentProps<'div'>;

function DrawerBody({ className, ...props }: DrawerBodyProps): JSX.Element {
  return <main className={cn('overflow-auto px-4 py-2', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

type DrawerFooterProps = ComponentProps<'div'>;

function DrawerFooter({ className, ...props }: DrawerFooterProps): JSX.Element {
  return <div className={cn('mt-auto flex flex-col-reverse gap-2 p-4', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

type DrawerTitleProps = ComponentProps<typeof DrawerPrimitive.Title>;

function DrawerTitle({ className, ...props }: DrawerTitleProps): JSX.Element {
  return (
    <DrawerPrimitive.Title className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

type DrawerDescriptionProps = ComponentProps<typeof DrawerPrimitive.Description>;

function DrawerDescription({ className, ...props }: DrawerDescriptionProps): JSX.Element {
  return <DrawerPrimitive.Description className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

interface DrawerCloseProps extends ComponentProps<typeof DrawerPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

function DrawerClose({ className, size, variant = 'outline', ...props }: DrawerCloseProps): JSX.Element {
  return <DrawerPrimitive.Close className={buttonVariants({ className, size, variant })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  DrawerBodyProps,
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
  DrawerTitleProps,
  DrawerTriggerProps,
};
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
