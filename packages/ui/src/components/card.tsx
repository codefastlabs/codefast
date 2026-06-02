import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardProps = ComponentProps<"div"> & {
  size?: "default" | "sm";
};

/**
 * @since 0.3.16-canary.0
 */
function Card({ className, size = "default", ...props }: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        "group/card flex flex-col gap-6 overflow-hidden rounded-xl bg-card py-6 text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className,
      )}
      data-size={size}
      data-slot="card"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardHeaderProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function CardHeader({ className, ...props }: CardHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4",
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardTitleProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function CardTitle({ children, className, ...props }: CardTitleProps): JSX.Element {
  return (
    <div
      className={cn(
        "cn-font-heading text-base leading-normal font-medium group-data-[size=sm]/card:text-sm",
        className,
      )}
      data-slot="card-title"
      {...props}
    >
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardDescriptionProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function CardDescription({ className, ...props }: CardDescriptionProps): JSX.Element {
  return (
    <div
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardContentProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function CardContent({ className, ...props }: CardContentProps): JSX.Element {
  return (
    <div
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardFooterProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function CardFooter({ className, ...props }: CardFooterProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center rounded-b-xl px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4",
        className,
      )}
      data-slot="card-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardAction
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardActionProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function CardAction({ className, ...props }: CardActionProps): JSX.Element {
  return (
    <div
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      data-slot="card-action"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
export type {
  CardActionProps,
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
};
