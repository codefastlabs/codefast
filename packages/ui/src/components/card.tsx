import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Card
 * -------------------------------------------------------------------------- */

function Card({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      className={cn('bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm', className)}
      data-slot="card"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardHeader
 * -------------------------------------------------------------------------- */

function CardHeader({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <div className={cn('flex flex-col gap-1.5 px-6', className)} data-slot="card-header" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CardTitle
 * -------------------------------------------------------------------------- */

function CardTitle({ children, className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('font-semibold leading-none', className)} data-slot="card-title" {...props}>
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CardDescription
 * -------------------------------------------------------------------------- */

function CardDescription({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <div className={cn('text-muted-foreground text-sm', className)} data-slot="card-description" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CardContent
 * -------------------------------------------------------------------------- */

function CardContent({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <div className={cn('px-6', className)} data-slot="card-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: CardFooter
 * -------------------------------------------------------------------------- */

function CardFooter({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return <div className={cn('flex items-center px-6', className)} data-slot="card-footer" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
