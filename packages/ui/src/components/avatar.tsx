'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { avatarVariants } from '@/styles/avatar-variants';

/* -----------------------------------------------------------------------------
 * Variant: Avatar
 * -------------------------------------------------------------------------- */

const { root, image, fallback } = avatarVariants();

/* -----------------------------------------------------------------------------
 * Component: Avatar
 * -------------------------------------------------------------------------- */

type AvatarElement = React.ElementRef<typeof AvatarPrimitive.Root>;
type AvatarProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>;

const Avatar = React.forwardRef<AvatarElement, AvatarProps>(({ className, ...props }, forwardedRef) => (
  <AvatarPrimitive.Root ref={forwardedRef} className={root({ className })} {...props} />
));

Avatar.displayName = AvatarPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: AvatarImage
 * -------------------------------------------------------------------------- */

type AvatarImageElement = React.ElementRef<typeof AvatarPrimitive.Image>;
type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

const AvatarImage = React.forwardRef<AvatarImageElement, AvatarImageProps>(({ className, ...props }, forwardedRef) => (
  <AvatarPrimitive.Image ref={forwardedRef} className={image({ className })} {...props} />
));

AvatarImage.displayName = AvatarPrimitive.Image.displayName;

/* -----------------------------------------------------------------------------
 * Component: AvatarFallback
 * -------------------------------------------------------------------------- */

type AvatarFallbackElement = React.ElementRef<typeof AvatarPrimitive.Fallback>;
type AvatarFallbackProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

const AvatarFallback = React.forwardRef<AvatarFallbackElement, AvatarFallbackProps>(
  ({ className, ...props }, forwardedRef) => (
    <AvatarPrimitive.Fallback ref={forwardedRef} className={fallback({ className })} {...props} />
  ),
);

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Avatar, AvatarImage, AvatarFallback, type AvatarProps, type AvatarImageProps, type AvatarFallbackProps };
