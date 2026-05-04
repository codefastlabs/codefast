"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

/* -----------------------------------------------------------------------------
 * Component: Avatar
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Avatar({ className, ...props }: AvatarProps): JSX.Element {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex size-8 shrink-0 overflow-hidden", "rounded-full", className)}
      data-slot="avatar"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarImage
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AvatarImageProps = ComponentProps<typeof AvatarPrimitive.Image>;

/**
 * @since 0.3.16-canary.0
 */
function AvatarImage({ className, ...props }: AvatarImageProps): JSX.Element {
  return (
    <AvatarPrimitive.Image
      className={cn("aspect-square size-full", className)}
      data-slot="avatar-image"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarFallback
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AvatarFallbackProps = ComponentProps<typeof AvatarPrimitive.Fallback>;

/**
 * @since 0.3.16-canary.0
 */
function AvatarFallback({ className, ...props }: AvatarFallbackProps): JSX.Element {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center",
        "rounded-full",
        "bg-muted",
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Avatar, AvatarFallback, AvatarImage };
export type { AvatarFallbackProps, AvatarImageProps, AvatarProps };
