import * as React from "react";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

type CardProps = React.HTMLAttributes<HTMLDivElement>;
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-card text-card-foreground rounded-lg border shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/* -----------------------------------------------------------------------------
 * Component: CardHeader
 * -------------------------------------------------------------------------- */

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

/* -----------------------------------------------------------------------------
 * Component: CardTitle
 * -------------------------------------------------------------------------- */

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  ),
);
CardTitle.displayName = "CardTitle";

/* -----------------------------------------------------------------------------
 * Component: CardDescription
 * -------------------------------------------------------------------------- */

type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* -----------------------------------------------------------------------------
 * Component: CardContent
 * -------------------------------------------------------------------------- */

type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

/* -----------------------------------------------------------------------------
 * Component: CardFooter
 * -------------------------------------------------------------------------- */

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  type CardProps,
  type CardHeaderProps,
  type CardFooterProps,
  type CardTitleProps,
  type CardDescriptionProps,
  type CardContentProps,
};
