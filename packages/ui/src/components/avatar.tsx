import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Avatar
 * -------------------------------------------------------------------------- */

type AvatarElement = ComponentRef<typeof AvatarPrimitive.Root>;
type AvatarProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>;

const Avatar = forwardRef<AvatarElement, AvatarProps>(({ className, ...props }, forwardedRef) => (
  <AvatarPrimitive.Root
    ref={forwardedRef}
    className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));

Avatar.displayName = AvatarPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: AvatarImage
 * -------------------------------------------------------------------------- */

type AvatarImageElement = ComponentRef<typeof AvatarPrimitive.Image>;
type AvatarImageProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

const AvatarImage = forwardRef<AvatarImageElement, AvatarImageProps>(({ className, ...props }, forwardedRef) => (
  <AvatarPrimitive.Image ref={forwardedRef} className={cn('aspect-square size-full', className)} {...props} />
));

AvatarImage.displayName = AvatarPrimitive.Image.displayName;

/* -----------------------------------------------------------------------------
 * Component: AvatarFallback
 * -------------------------------------------------------------------------- */

type AvatarFallbackElement = ComponentRef<typeof AvatarPrimitive.Fallback>;
type AvatarFallbackProps = ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

const AvatarFallback = forwardRef<AvatarFallbackElement, AvatarFallbackProps>(
  ({ className, ...props }, forwardedRef) => (
    <AvatarPrimitive.Fallback
      ref={forwardedRef}
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  ),
);

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Avatar, AvatarFallback, AvatarImage, type AvatarFallbackProps, type AvatarImageProps, type AvatarProps };
