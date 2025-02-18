import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

type CardProps = ComponentProps<'div'>;

function Card({ className, ...props }: CardProps): JSX.Element {
  return (
    <div
      className={cn('bg-card text-card-foreground rounded-lg border shadow', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardHeader
 * -------------------------------------------------------------------------- */

type CardHeaderProps = ComponentProps<'div'>;

function CardHeader({ className, ...props }: CardHeaderProps): JSX.Element {
  return <div className={cn('flex flex-col gap-y-1.5 p-6', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CardTitle
 * -------------------------------------------------------------------------- */

type CardTitleProps = ComponentProps<'h3'>;

function CardTitle({ children, className, ...props }: CardTitleProps): JSX.Element {
  return (
    <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardDescription
 * -------------------------------------------------------------------------- */

type CardDescriptionProps = ComponentProps<'p'>;

function CardDescription({ className, ...props }: CardDescriptionProps): JSX.Element {
  return <p className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CardContent
 * -------------------------------------------------------------------------- */

type CardContentProps = ComponentProps<'div'>;

function CardContent({ className, ...props }: CardContentProps): JSX.Element {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CardFooter
 * -------------------------------------------------------------------------- */

type CardFooterProps = ComponentProps<'div'>;

function CardFooter({ className, ...props }: CardFooterProps): JSX.Element {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
};
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
