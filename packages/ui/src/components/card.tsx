import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

type CardElement = HTMLDivElement;
type CardProps = HTMLAttributes<HTMLDivElement>;

const Card = forwardRef<CardElement, CardProps>(
  ({ className, ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cn(
        'bg-card text-card-foreground rounded-lg border shadow',
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = 'Card';

/* -----------------------------------------------------------------------------
 * Component: CardHeader
 * -------------------------------------------------------------------------- */

type CardHeaderElement = HTMLDivElement;
type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

const CardHeader = forwardRef<CardHeaderElement, CardHeaderProps>(
  ({ className, ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cn('flex flex-col gap-y-1.5 p-6', className)}
      {...props}
    />
  ),
);

CardHeader.displayName = 'CardHeader';

/* -----------------------------------------------------------------------------
 * Component: CardTitle
 * -------------------------------------------------------------------------- */

type CardTitleElement = HTMLParagraphElement;
type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

const CardTitle = forwardRef<CardTitleElement, CardTitleProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <h3
      ref={forwardedRef}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  ),
);

CardTitle.displayName = 'CardTitle';

/* -----------------------------------------------------------------------------
 * Component: CardDescription
 * -------------------------------------------------------------------------- */

type CardDescriptionElement = HTMLParagraphElement;
type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const CardDescription = forwardRef<
  CardDescriptionElement,
  CardDescriptionProps
>(({ className, ...props }, forwardedRef) => (
  <p
    ref={forwardedRef}
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

/* -----------------------------------------------------------------------------
 * Component: CardBody
 * -------------------------------------------------------------------------- */

type CardContentElement = HTMLDivElement;
type CardContentProps = HTMLAttributes<HTMLDivElement>;

const CardBody = forwardRef<CardContentElement, CardContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <div ref={forwardedRef} className={cn('p-6 pt-0', className)} {...props} />
  ),
);

CardBody.displayName = 'CardBody';

/* -----------------------------------------------------------------------------
 * Component: CardFooter
 * -------------------------------------------------------------------------- */

type CardFooterElement = HTMLDivElement;
type CardFooterProps = HTMLAttributes<HTMLDivElement>;

const CardFooter = forwardRef<CardFooterElement, CardFooterProps>(
  ({ className, ...props }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  ),
);

CardFooter.displayName = 'CardFooter';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardContentProps,
  type CardDescriptionProps,
  type CardFooterProps,
  type CardHeaderProps,
  type CardProps,
  type CardTitleProps,
};
