import type { ComponentProps, JSX, ReactNode } from 'react';

import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon, EllipsisIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Breadcrumb
 * -------------------------------------------------------------------------- */

interface BreadcrumbProps extends ComponentProps<'nav'> {
  separator?: ReactNode;
}

function Breadcrumb({ ...props }: BreadcrumbProps): JSX.Element {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbList
 * -------------------------------------------------------------------------- */

type BreadcrumbListProps = ComponentProps<'ol'>;

function BreadcrumbList({ className, ...props }: BreadcrumbListProps): JSX.Element {
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

type BreadcrumbItemProps = ComponentProps<'li'>;

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps): JSX.Element {
  return <li className={cn('inline-flex items-center gap-1.5', className)} data-slot="breadcrumb-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbLink
 * -------------------------------------------------------------------------- */

interface BreadcrumbLinkProps extends ComponentProps<'a'> {
  asChild?: boolean;
}

function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps): JSX.Element {
  const Component = asChild ? Slot : 'a';

  return (
    <Component className={cn('hover:text-foreground transition', className)} data-slot="breadcrumb-link" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbPage
 * -------------------------------------------------------------------------- */

type BreadcrumbPageProps = ComponentProps<'span'>;

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps): JSX.Element {
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

type BreadcrumbSeparatorProps = ComponentProps<'li'>;

function BreadcrumbSeparator({ children, ...props }: BreadcrumbSeparatorProps): JSX.Element {
  return (
    <li aria-hidden="true" data-slot="breadcrumb-separator" role="presentation" {...props}>
      {children ?? <ChevronRightIcon className="size-3.5" />}
    </li>
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbEllipsis
 * -------------------------------------------------------------------------- */

type BreadcrumbEllipsisProps = ComponentProps<'span'>;

function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps): JSX.Element {
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

export type {
  BreadcrumbEllipsisProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbListProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparatorProps,
};
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
