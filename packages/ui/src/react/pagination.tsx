import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import { cn } from '../lib/utils';
import { buttonVariants, type ButtonProps } from './button';

/* -----------------------------------------------------------------------------
 * Component: Pagination
 * -------------------------------------------------------------------------- */

type PaginationProps = React.HTMLAttributes<HTMLElement>;

function Pagination({ className, ...props }: PaginationProps): React.JSX.Element {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationContent
 * -------------------------------------------------------------------------- */

type PaginationContentElement = HTMLUListElement;
type PaginationContentProps = React.HTMLAttributes<HTMLUListElement>;

const PaginationContent = React.forwardRef<PaginationContentElement, PaginationContentProps>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  ),
);

PaginationContent.displayName = 'PaginationContent';

/* -----------------------------------------------------------------------------
 * Component: PaginationItem
 * -------------------------------------------------------------------------- */

type PaginationItemElement = HTMLLIElement;
type PaginationItemProps = React.LiHTMLAttributes<HTMLLIElement>;

const PaginationItem = React.forwardRef<PaginationItemElement, PaginationItemProps>((props, ref) => (
  <li ref={ref} {...props} />
));

PaginationItem.displayName = 'PaginationItem';

/* -----------------------------------------------------------------------------
 * Component: PaginationLink
 * -------------------------------------------------------------------------- */

interface PaginationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, Pick<ButtonProps, 'size'> {
  isActive?: boolean;
}

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  children,
  ...props
}: PaginationLinkProps): React.JSX.Element {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
        className,
      })}
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

function PaginationPrevious({ className, ...props }: PaginationPreviousProps): React.JSX.Element {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 pl-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
      <span>Previous</span>
    </PaginationLink>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationNext
 * -------------------------------------------------------------------------- */

type PaginationNextProps = PaginationLinkProps;

function PaginationNext({ className, ...props }: PaginationNextProps): React.JSX.Element {
  return (
    <PaginationLink aria-label="Go to next page" size="default" className={cn('gap-1 pr-2.5', className)} {...props}>
      <span>Next</span>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationEllipsis
 * -------------------------------------------------------------------------- */

type PaginationEllipsisProps = React.HTMLAttributes<HTMLSpanElement>;

function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps): React.JSX.Element {
  return (
    <span aria-hidden className={cn('flex size-10 items-center justify-center', className)} {...props}>
      <DotsHorizontalIcon className="size-4" />
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
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  type PaginationProps,
  type PaginationContentProps,
  type PaginationLinkProps,
  type PaginationItemProps,
  type PaginationPreviousProps,
  type PaginationNextProps,
  type PaginationEllipsisProps,
};
