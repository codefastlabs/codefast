import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type CardProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function Card({ className, ...props }: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 overflow-auto py-6",
        "rounded-xl border",
        "bg-card text-card-foreground shadow-sm",
        className,
      )}
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
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5",
        "px-6",
        "has-[data-slot=card-action]:grid-cols-[1fr_auto]",
        "[.border-b]:pb-6",
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
    <div className={cn("leading-none font-semibold", className)} data-slot="card-title" {...props}>
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
  return <div className={cn("px-6", className)} data-slot="card-content" {...props} />;
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
      className={cn("flex items-center", "px-6", "[.border-t]:pt-6", className)}
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
