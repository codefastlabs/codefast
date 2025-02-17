import type { ComponentProps, JSX } from 'react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Avatar
 * -------------------------------------------------------------------------- */

type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root>;

function Avatar({ className, ...props }: AvatarProps): JSX.Element {
  return (
    <AvatarPrimitive.Root
      className={cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarImage
 * -------------------------------------------------------------------------- */

type AvatarImageProps = ComponentProps<typeof AvatarPrimitive.Image>;

function AvatarImage({ className, ...props }: AvatarImageProps): JSX.Element {
  return <AvatarPrimitive.Image className={cn('aspect-square size-full', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AvatarFallback
 * -------------------------------------------------------------------------- */

type AvatarFallbackProps = ComponentProps<typeof AvatarPrimitive.Fallback>;

function AvatarFallback({ className, ...props }: AvatarFallbackProps): JSX.Element {
  return (
    <AvatarPrimitive.Fallback
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { AvatarFallbackProps, AvatarImageProps, AvatarProps };
export { Avatar, AvatarFallback, AvatarImage };
