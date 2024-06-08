'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Drawer
 * -------------------------------------------------------------------------- */

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root>;

function Drawer({ shouldScaleBackground = true, ...props }: DrawerProps): React.JSX.Element {
  return <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTrigger
 * -------------------------------------------------------------------------- */

type DrawerTriggerProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Trigger>;
const DrawerTrigger = DrawerPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

type DrawerCloseProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>;
const DrawerClose = DrawerPrimitive.Close;

/* -----------------------------------------------------------------------------
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

type DrawerContentElement = React.ElementRef<typeof DrawerPrimitive.Content>;
type DrawerContentProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>;

const DrawerContent = React.forwardRef<DrawerContentElement, DrawerContentProps>(
  ({ children, className, ...props }, ref) => (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          'bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-xl border',
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 h-2 w-24 rounded-full" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  ),
);

DrawerContent.displayName = 'DrawerContent';

/* -----------------------------------------------------------------------------
 * Component: DrawerHeader
 * -------------------------------------------------------------------------- */

type DrawerHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function DrawerHeader({ className, ...props }: DrawerHeaderProps): React.JSX.Element {
  return <div className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

type DrawerFooterProps = React.HTMLAttributes<HTMLDivElement>;

function DrawerFooter({ className, ...props }: DrawerFooterProps): React.JSX.Element {
  return <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

type DrawerTitleElement = React.ElementRef<typeof DrawerPrimitive.Title>;
type DrawerTitleProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>;

const DrawerTitle = React.forwardRef<DrawerTitleElement, DrawerTitleProps>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));

DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

type DrawerDescriptionElement = React.ElementRef<typeof DrawerPrimitive.Description>;
type DrawerDescriptionProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>;

const DrawerDescription = React.forwardRef<DrawerDescriptionElement, DrawerDescriptionProps>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Description ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />
  ),
);

DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  type DrawerProps,
  type DrawerTriggerProps,
  type DrawerCloseProps,
  type DrawerContentProps,
  type DrawerHeaderProps,
  type DrawerFooterProps,
  type DrawerTitleProps,
  type DrawerDescriptionProps,
};
