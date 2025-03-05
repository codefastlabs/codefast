import type { ComponentProps, JSX } from 'react';

import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from 'lucide-react';

import type { ButtonVariantsProps } from '@/variants/button.variants';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/variants/button.variants';

/* -----------------------------------------------------------------------------
 * Component: Pagination
 * -------------------------------------------------------------------------- */

type PaginationProps = ComponentProps<'nav'>;

function Pagination({ className, ...props }: PaginationProps): JSX.Element {
  return (
    <nav
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      role="navigation"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationContent
 * -------------------------------------------------------------------------- */

type PaginationContentProps = ComponentProps<'ul'>;

function PaginationContent({ className, ...props }: PaginationContentProps): JSX.Element {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PaginationItem
 * -------------------------------------------------------------------------- */

type PaginationItemProps = ComponentProps<'li'>;

function PaginationItem(props: PaginationItemProps): JSX.Element {
  return <li {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PaginationLink
 * -------------------------------------------------------------------------- */

interface PaginationLinkProps extends ComponentProps<'a'>, Pick<ButtonVariantsProps, 'icon' | 'size'> {
  isActive?: boolean;
}

function PaginationLink({
  children,
  className,
  icon = true,
  isActive,
  size,
  ...props
}: PaginationLinkProps): JSX.Element {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={buttonVariants({ className, icon, size, variant: isActive ? 'outline' : 'ghost' })}
      {...props}
    >
      {children}
    </a>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationPrevious
 * -------------------------------------------------------------------------- */

type PaginationPreviousProps = PaginationLinkProps;

function PaginationPrevious({ ...props }: PaginationPreviousProps): JSX.Element {
  return (
    <PaginationLink aria-label="Go to previous page" icon={false} {...props}>
      <ChevronLeftIcon className="size-4" />
      <span>Previous</span>
    </PaginationLink>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationNext
 * -------------------------------------------------------------------------- */

type PaginationNextProps = PaginationLinkProps;

function PaginationNext({ ...props }: PaginationNextProps): JSX.Element {
  return (
    <PaginationLink aria-label="Go to next page" icon={false} {...props}>
      <span>Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationEllipsis
 * -------------------------------------------------------------------------- */

type PaginationEllipsisProps = ComponentProps<'span'>;

function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps): JSX.Element {
  return (
    <span aria-hidden className={cn('flex size-10 items-center justify-center', className)} {...props}>
      <EllipsisIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  PaginationContentProps,
  PaginationEllipsisProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationNextProps,
  PaginationPreviousProps,
  PaginationProps,
};
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
