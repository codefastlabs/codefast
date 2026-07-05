import { Slot } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import type { MarkerVariants } from "#/variants/marker";
import { markerVariants } from "#/variants/marker";

/* -----------------------------------------------------------------------------
 * Component: Marker
 * -------------------------------------------------------------------------- */

/**
 * Inline divider for a message feed — a date, unread line, or section label.
 *
 * @since 0.5.0-canary.3
 */
interface MarkerProps extends ComponentProps<"div">, MarkerVariants {
  asChild?: boolean;
}

/**
 * @since 0.5.0-canary.3
 */
function Marker({ asChild = false, className, variant = "default", ...props }: MarkerProps): JSX.Element {
  const Component = asChild ? Slot.Root : "div";

  return (
    <Component
      className={markerVariants({ className, variant })}
      data-slot="marker"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MarkerIcon
 * -------------------------------------------------------------------------- */

/**
 * Decorative leading icon for a marker.
 *
 * @since 0.5.0-canary.3
 */
type MarkerIconProps = ComponentProps<"span">;

/**
 * @since 0.5.0-canary.3
 */
function MarkerIcon({ className, ...props }: MarkerIconProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn("size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4", className)}
      data-slot="marker-icon"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: MarkerContent
 * -------------------------------------------------------------------------- */

/**
 * Marker label; centers between the rules in the `separator` variant.
 *
 * @since 0.5.0-canary.3
 */
type MarkerContentProps = ComponentProps<"span">;

/**
 * @since 0.5.0-canary.3
 */
function MarkerContent({ className, ...props }: MarkerContentProps): JSX.Element {
  return (
    <span
      className={cn(
        "min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      data-slot="marker-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Marker, MarkerContent, MarkerIcon };
export type { MarkerContentProps, MarkerIconProps, MarkerProps };
