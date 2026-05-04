import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn, tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variants: Empty
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const emptyMediaVariants = tv({
  base: [
    "mb-2 flex shrink-0 items-center justify-center",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-transparent",
      icon: [
        "flex size-10 shrink-0 items-center justify-center",
        "rounded-xl",
        "bg-muted text-foreground",
        "[&_svg:not([class*='size-'])]:size-6",
      ],
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: Empty
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type EmptyProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function Empty({ className, ...props }: EmptyProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-6",
        "rounded-xl border-dashed",
        "text-center text-balance",
        "md:p-12",
        className,
      )}
      data-slot="empty"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type EmptyHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function EmptyHeader({ className, ...props }: EmptyHeaderProps): JSX.Element {
  return (
    <div
      className={cn("flex max-w-sm flex-col items-center gap-2", "text-center", className)}
      data-slot="empty-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyMedia
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type EmptyMediaProps = ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>;

/**
 * @since 0.3.16-canary.0
 */
function EmptyMedia({ className, variant = "default", ...props }: EmptyMediaProps): JSX.Element {
  return (
    <div
      className={emptyMediaVariants({ className, variant })}
      data-slot="empty-icon"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type EmptyTitleProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function EmptyTitle({ className, ...props }: EmptyTitleProps): JSX.Element {
  return (
    <div
      className={cn("text-lg font-medium tracking-tight", className)}
      data-slot="empty-title"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type EmptyDescriptionProps = ComponentProps<"p">;

/**
 * @since 0.3.16-canary.0
 */
function EmptyDescription({ className, ...props }: EmptyDescriptionProps): JSX.Element {
  return (
    <p
      className={cn(
        "text-sm/relaxed text-muted-foreground",
        "[&>a]:underline [&>a]:underline-offset-4",
        "[&>a:hover]:text-primary",
        className,
      )}
      data-slot="empty-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: EmptyContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type EmptyContentProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function EmptyContent({ className, ...props }: EmptyContentProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4",
        "text-sm text-balance",
        className,
      )}
      data-slot="empty-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  emptyMediaVariants,
  EmptyTitle,
};

export type {
  EmptyContentProps,
  EmptyDescriptionProps,
  EmptyHeaderProps,
  EmptyMediaProps,
  EmptyProps,
  EmptyTitleProps,
};
