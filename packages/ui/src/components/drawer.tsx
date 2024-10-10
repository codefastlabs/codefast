'use client';

import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
} from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/utils';
import {
  buttonVariants,
  type ButtonVariantsProps,
} from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Drawer
 * -------------------------------------------------------------------------- */

type DrawerProps = ComponentProps<typeof DrawerPrimitive.Root>;

function Drawer({
  shouldScaleBackground = true,
  ...props
}: DrawerProps): JSX.Element {
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTrigger
 * -------------------------------------------------------------------------- */

type DrawerTriggerProps = ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Trigger
>;
const DrawerTrigger = DrawerPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: DrawerContent
 * -------------------------------------------------------------------------- */

type DrawerContentElement = ComponentRef<typeof DrawerPrimitive.Content>;
type DrawerContentProps = ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Content
>;

const DrawerContent = forwardRef<DrawerContentElement, DrawerContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
      <DrawerPrimitive.Content
        ref={forwardedRef}
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

type DrawerHeaderProps = HTMLAttributes<HTMLDivElement>;

function DrawerHeader({ className, ...props }: DrawerHeaderProps): JSX.Element {
  return (
    <div
      className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerBody
 * -------------------------------------------------------------------------- */

type DrawerBodyProps = HTMLAttributes<HTMLDivElement>;

function DrawerBody({ className, ...props }: DrawerBodyProps): JSX.Element {
  return (
    <main className={cn('overflow-auto px-4 py-2', className)} {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerFooter
 * -------------------------------------------------------------------------- */

type DrawerFooterProps = HTMLAttributes<HTMLDivElement>;

function DrawerFooter({ className, ...props }: DrawerFooterProps): JSX.Element {
  return (
    <div
      className={cn('mt-auto flex flex-col-reverse gap-2 p-4', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: DrawerTitle
 * -------------------------------------------------------------------------- */

type DrawerTitleElement = ComponentRef<typeof DrawerPrimitive.Title>;
type DrawerTitleProps = ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>;

const DrawerTitle = forwardRef<DrawerTitleElement, DrawerTitleProps>(
  ({ className, ...props }, forwardedRef) => (
    <DrawerPrimitive.Title
      ref={forwardedRef}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  ),
);

DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

/* -----------------------------------------------------------------------------
 * Component: DrawerDescription
 * -------------------------------------------------------------------------- */

type DrawerDescriptionElement = ComponentRef<
  typeof DrawerPrimitive.Description
>;
type DrawerDescriptionProps = ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Description
>;

const DrawerDescription = forwardRef<
  DrawerDescriptionElement,
  DrawerDescriptionProps
>(({ className, ...props }, forwardedRef) => (
  <DrawerPrimitive.Description
    ref={forwardedRef}
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));

DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/* -----------------------------------------------------------------------------
 * Component: DrawerClose
 * -------------------------------------------------------------------------- */

type DrawerCloseElement = ComponentRef<typeof DrawerPrimitive.Close>;

interface DrawerCloseProps
  extends ComponentPropsWithoutRef<typeof DrawerPrimitive.Close> {
  size?: ButtonVariantsProps['size'];
  variant?: ButtonVariantsProps['variant'];
}

const DrawerClose = forwardRef<DrawerCloseElement, DrawerCloseProps>(
  ({ className, size, variant = 'outline', ...props }, forwardedRef) => (
    <DrawerPrimitive.Close
      ref={forwardedRef}
      className={buttonVariants({ className, size, variant })}
      {...props}
    />
  ),
);

DrawerClose.displayName = DrawerPrimitive.Close.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Drawer,
  DrawerBody,
  type DrawerBodyProps,
  DrawerClose,
  type DrawerCloseProps,
  DrawerContent,
  type DrawerContentProps,
  DrawerDescription,
  type DrawerDescriptionProps,
  DrawerFooter,
  type DrawerFooterProps,
  DrawerHeader,
  type DrawerHeaderProps,
  type DrawerProps,
  DrawerTitle,
  type DrawerTitleProps,
  DrawerTrigger,
  type DrawerTriggerProps,
};
