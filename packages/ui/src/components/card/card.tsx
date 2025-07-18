import type { ComponentProps, JSX } from "react";

import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

type CardProps = ComponentProps<"div">;

function Card({ className, ...props }: CardProps): JSX.Element {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 overflow-auto rounded-xl border py-6 shadow-sm",
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

type CardHeaderProps = ComponentProps<"div">;

function CardHeader({ className, ...props }: CardHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "@container/card-header [.border-b]:pb-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto]",
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

type CardTitleProps = ComponentProps<"div">;

function CardTitle({ children, className, ...props }: CardTitleProps): JSX.Element {
  return (
    <div className={cn("font-semibold leading-none", className)} data-slot="card-title" {...props}>
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardDescription
 * -------------------------------------------------------------------------- */

type CardDescriptionProps = ComponentProps<"div">;

function CardDescription({ className, ...props }: CardDescriptionProps): JSX.Element {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardContent
 * -------------------------------------------------------------------------- */

type CardContentProps = ComponentProps<"div">;

function CardContent({ className, ...props }: CardContentProps): JSX.Element {
  return <div className={cn("px-6", className)} data-slot="card-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CardFooter
 * -------------------------------------------------------------------------- */

type CardFooterProps = ComponentProps<"div">;

function CardFooter({ className, ...props }: CardFooterProps): JSX.Element {
  return (
    <div
      className={cn("[.border-t]:pt-6 flex items-center px-6", className)}
      data-slot="card-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardAction
 * -------------------------------------------------------------------------- */

type CardActionProps = ComponentProps<"div">;

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
