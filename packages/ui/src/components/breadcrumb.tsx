import type { ComponentProps, JSX, ReactNode } from 'react';

import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon, EllipsisIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Breadcrumb
 * -------------------------------------------------------------------------- */

function Breadcrumb({
  ...props
}: ComponentProps<'nav'> & {
  separator?: ReactNode;
}): JSX.Element {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbList
 * -------------------------------------------------------------------------- */

function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>): JSX.Element {
  return (
    <ol
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2',
        className,
      )}
      data-slot="breadcrumb-list"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbItem
 * -------------------------------------------------------------------------- */

function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>): JSX.Element {
  return <li className={cn('inline-flex items-center gap-1.5', className)} data-slot="breadcrumb-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbLink
 * -------------------------------------------------------------------------- */

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: ComponentProps<'a'> & {
  asChild?: boolean;
}): JSX.Element {
  const Component = asChild ? Slot : 'a';

  return (
    <Component
      className={cn('hover:text-foreground transition-colors', className)}
      data-slot="breadcrumb-link"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbPage
 * -------------------------------------------------------------------------- */

function BreadcrumbPage({ className, ...props }: ComponentProps<'span'>): JSX.Element {
  return (
    <span
      aria-current="page"
      aria-disabled="true"
      className={cn('text-foreground font-normal', className)}
      data-slot="breadcrumb-page"
      role="link"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbSeparator
 * -------------------------------------------------------------------------- */

function BreadcrumbSeparator({ children, ...props }: ComponentProps<'li'>): JSX.Element {
  return (
    <li aria-hidden="true" data-slot="breadcrumb-separator" role="presentation" {...props}>
      {children ?? <ChevronRightIcon className="size-3.5" />}
    </li>
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbEllipsis
 * -------------------------------------------------------------------------- */

function BreadcrumbEllipsis({ className, ...props }: ComponentProps<'span'>): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-4 items-center justify-center', className)}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <EllipsisIcon className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
