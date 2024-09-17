'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';
import { drawerVariants } from '@/styles/drawer-variants';

/* -----------------------------------------------------------------------------
 * Variant: Drawer
 * -------------------------------------------------------------------------- */

const { overlay, content, handle, header, body, footer, title, description } = drawerVariants();

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
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

type DrawerContentElement = React.ElementRef<typeof DrawerPrimitive.Content>;
type DrawerContentProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>;

const DrawerContent = React.forwardRef<DrawerContentElement, DrawerContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className={overlay()} />
      <DrawerPrimitive.Content ref={forwardedRef} className={content({ className })} {...props}>
        <div className={handle()} />
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
  return <div className={header({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerBody
 * -------------------------------------------------------------------------- */

type DrawerBodyProps = React.HTMLAttributes<HTMLDivElement>;

function DrawerBody({ className, ...props }: DrawerBodyProps): React.JSX.Element {
  return <main className={body({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

type DrawerFooterProps = React.HTMLAttributes<HTMLDivElement>;

function DrawerFooter({ className, ...props }: DrawerFooterProps): React.JSX.Element {
  return <div className={footer({ className })} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

type DrawerTitleElement = React.ElementRef<typeof DrawerPrimitive.Title>;
type DrawerTitleProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>;

const DrawerTitle = React.forwardRef<DrawerTitleElement, DrawerTitleProps>(({ className, ...props }, forwardedRef) => (
  <DrawerPrimitive.Title ref={forwardedRef} className={title({ className })} {...props} />
));

DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

type DrawerDescriptionElement = React.ElementRef<typeof DrawerPrimitive.Description>;
type DrawerDescriptionProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>;

const DrawerDescription = React.forwardRef<DrawerDescriptionElement, DrawerDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <DrawerPrimitive.Description ref={forwardedRef} className={description({ className })} {...props} />
  ),
);

DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

type DrawerCloseElement = React.ElementRef<typeof DrawerPrimitive.Close>;

interface DrawerCloseProps extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const DrawerClose = React.forwardRef<DrawerCloseElement, DrawerCloseProps>(
  ({ className, size, variant = 'outline', ...props }, forwardedRef) => (
    <DrawerPrimitive.Close ref={forwardedRef} className={buttonVariants({ className, size, variant })} {...props} />
  ),
);

DrawerClose.displayName = DrawerPrimitive.Close.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  type DrawerProps,
  type DrawerTriggerProps,
  type DrawerCloseProps,
  type DrawerContentProps,
  type DrawerHeaderProps,
  type DrawerBodyProps,
  type DrawerFooterProps,
  type DrawerTitleProps,
  type DrawerDescriptionProps,
};
