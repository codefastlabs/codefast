import * as React from 'react';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

type CardElement = HTMLDivElement;
type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<CardElement, CardProps>(({ className, ...props }, forwardedRef) => (
  <div
    ref={forwardedRef}
    className={cn('bg-card text-card-foreground rounded-lg border shadow', className)}
    {...props}
  />
));

Card.displayName = 'Card';

/* -----------------------------------------------------------------------------
 * Component: CardHeader
 * -------------------------------------------------------------------------- */

type CardHeaderElement = HTMLDivElement;
type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const CardHeader = React.forwardRef<CardHeaderElement, CardHeaderProps>(({ className, ...props }, forwardedRef) => (
  <div ref={forwardedRef} className={cn('flex flex-col gap-y-1.5 p-6', className)} {...props} />
));

CardHeader.displayName = 'CardHeader';

/* -----------------------------------------------------------------------------
 * Component: CardTitle
 * -------------------------------------------------------------------------- */

type CardTitleElement = HTMLParagraphElement;
type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const CardTitle = React.forwardRef<CardTitleElement, CardTitleProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <h3 ref={forwardedRef} className={cn('font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  ),
);

CardTitle.displayName = 'CardTitle';

/* -----------------------------------------------------------------------------
 * Component: CardDescription
 * -------------------------------------------------------------------------- */

type CardDescriptionElement = HTMLParagraphElement;
type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const CardDescription = React.forwardRef<CardDescriptionElement, CardDescriptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <p ref={forwardedRef} className={cn('text-muted-foreground text-sm', className)} {...props} />
  ),
);

CardDescription.displayName = 'CardDescription';

/* -----------------------------------------------------------------------------
 * Component: CardContent
 * -------------------------------------------------------------------------- */

type CardContentElement = HTMLDivElement;
type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

const CardContent = React.forwardRef<CardContentElement, CardContentProps>(({ className, ...props }, forwardedRef) => (
  <div ref={forwardedRef} className={cn('p-6 pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

/* -----------------------------------------------------------------------------
 * Component: CardFooter
 * -------------------------------------------------------------------------- */

type CardFooterElement = HTMLDivElement;
type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

const CardFooter = React.forwardRef<CardFooterElement, CardFooterProps>(({ className, ...props }, forwardedRef) => (
  <div ref={forwardedRef} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));

CardFooter.displayName = 'CardFooter';

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
