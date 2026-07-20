import * as AvatarPrimitive from "radix-ui/avatar";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Avatar
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AvatarProps = ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg";
};

/**
 * @since 0.3.16-canary.0
 */
function Avatar({ className, size = "default", ...props }: AvatarProps): JSX.Element {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        className,
      )}
      data-size={size}
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
      className={cn("aspect-square size-full rounded-full object-cover", className)}
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
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarBadge
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AvatarBadgeProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function AvatarBadge({ className, ...props }: AvatarBadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        "absolute inset-e-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      data-slot="avatar-badge"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AvatarGroupProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AvatarGroup({ className, ...props }: AvatarGroupProps): JSX.Element {
  return (
    <div
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background rtl:space-x-reverse",
        className,
      )}
      data-slot="avatar-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AvatarGroupCount
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AvatarGroupCountProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function AvatarGroupCount({ className, ...props }: AvatarGroupCountProps): JSX.Element {
  return (
    <div
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className,
      )}
      data-slot="avatar-group-count"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
export type {
  AvatarBadgeProps,
  AvatarFallbackProps,
  AvatarGroupCountProps,
  AvatarGroupProps,
  AvatarImageProps,
  AvatarProps,
};
