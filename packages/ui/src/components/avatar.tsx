"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Avatar
 * -------------------------------------------------------------------------- */

function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>): JSX.Element {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      data-slot="avatar"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarImage
 * -------------------------------------------------------------------------- */

function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>): JSX.Element {
  return (
    <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} data-slot="avatar-image" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarFallback
 * -------------------------------------------------------------------------- */

function AvatarFallback({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>): JSX.Element {
  return (
    <AvatarPrimitive.Fallback
      className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Avatar, AvatarFallback, AvatarImage };
