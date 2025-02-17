import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  JSX,
  LiHTMLAttributes,
  OlHTMLAttributes,
  ReactNode,
} from 'react';

import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon, EllipsisIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Breadcrumb
 * -------------------------------------------------------------------------- */

interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  separator?: ReactNode;
}

function Breadcrumb({ ...props }: BreadcrumbProps): JSX.Element {
  return <nav aria-label="breadcrumb" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbList
 * -------------------------------------------------------------------------- */

type BreadcrumbListProps = OlHTMLAttributes<HTMLOListElement>;

function BreadcrumbList({ className, ...props }: BreadcrumbListProps): JSX.Element {
  return (
    <ol
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbItem
 * -------------------------------------------------------------------------- */

type BreadcrumbItemProps = LiHTMLAttributes<HTMLLIElement>;

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps): JSX.Element {
  return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbLink
 * -------------------------------------------------------------------------- */

interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
}

function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps): JSX.Element {
  const Component = asChild ? Slot : 'a';

  return <Component className={cn('hover:text-foreground transition', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbPage
 * -------------------------------------------------------------------------- */

type BreadcrumbPageProps = HTMLAttributes<HTMLSpanElement>;

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps): JSX.Element {
  return (
    <span
      aria-current="page"
      aria-disabled="true"
      className={cn('text-foreground font-normal', className)}
      role="link"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbSeparator
 * -------------------------------------------------------------------------- */

type BreadcrumbSeparatorProps = LiHTMLAttributes<HTMLLIElement>;

function BreadcrumbSeparator({ children, ...props }: BreadcrumbSeparatorProps): JSX.Element {
  return (
    <li aria-hidden="true" role="presentation" {...props}>
      {children ?? <ChevronRightIcon className="size-3.5" />}
    </li>
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbEllipsis
 * -------------------------------------------------------------------------- */

type BreadcrumbEllipsisProps = HTMLAttributes<HTMLSpanElement>;

function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-4 items-center justify-center', className)}
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
