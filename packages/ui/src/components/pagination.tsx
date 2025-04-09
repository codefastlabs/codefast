import type { ComponentProps, JSX } from 'react';

import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from 'lucide-react';

import type { VariantProps } from '@/lib/utils';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Pagination
 * -------------------------------------------------------------------------- */

function Pagination({ className, ...props }: ComponentProps<'nav'>): JSX.Element {
  return (
    <nav
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      data-slot="pagination"
      role="navigation"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationContent
 * -------------------------------------------------------------------------- */

function PaginationContent({ className, ...props }: ComponentProps<'ul'>): JSX.Element {
  return <ul className={cn('flex flex-row items-center gap-1', className)} data-slot="pagination-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PaginationItem
 * -------------------------------------------------------------------------- */

function PaginationItem(props: ComponentProps<'li'>): JSX.Element {
  return <li data-slot="pagination-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PaginationLink
 * -------------------------------------------------------------------------- */

function PaginationLink({
  children,
  className,
  isActive,
  size = 'icon',
  ...props
}: ComponentProps<'a'> &
  Pick<VariantProps<typeof buttonVariants>, 'size'> & {
    isActive?: boolean;
  }): JSX.Element {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={buttonVariants({ className, size, variant: isActive ? 'outline' : 'ghost' })}
      data-slot="pagination-link"
      {...props}
    >
      {children}
    </a>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationPrevious
 * -------------------------------------------------------------------------- */

function PaginationPrevious({
  ...props
}: ComponentProps<'a'> &
  Pick<VariantProps<typeof buttonVariants>, 'size'> & {
    isActive?: boolean;
  }): JSX.Element {
  return (
    <PaginationLink aria-label="Go to previous page" data-slot="pagination-previous" size="md" {...props}>
      <ChevronLeftIcon className="size-4" />
      <span>Previous</span>
    </PaginationLink>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationNext
 * -------------------------------------------------------------------------- */

function PaginationNext({
  ...props
}: ComponentProps<'a'> &
  Pick<VariantProps<typeof buttonVariants>, 'size'> & {
    isActive?: boolean;
  }): JSX.Element {
  return (
    <PaginationLink aria-label="Go to next page" data-slot="pagination-next" size="md" {...props}>
      <span>Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationEllipsis
 * -------------------------------------------------------------------------- */

function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>): JSX.Element {
  return (
    <span
      aria-hidden
      className={cn('flex size-10 items-center justify-center', className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <EllipsisIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
