import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Pagination
 * -------------------------------------------------------------------------- */

type PaginationProps = React.HTMLAttributes<HTMLElement>;

function Pagination({ className, ...props }: PaginationProps): React.JSX.Element {
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

type PaginationContentElement = HTMLUListElement;
type PaginationContentProps = React.HTMLAttributes<HTMLUListElement>;

const PaginationContent = React.forwardRef<PaginationContentElement, PaginationContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <ul ref={forwardedRef} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  ),
);

PaginationContent.displayName = 'PaginationContent';

/* -----------------------------------------------------------------------------
 * Component: PaginationItem
 * -------------------------------------------------------------------------- */

type PaginationItemElement = HTMLLIElement;
type PaginationItemProps = React.LiHTMLAttributes<HTMLLIElement>;

const PaginationItem = React.forwardRef<PaginationItemElement, PaginationItemProps>((props, forwardedRef) => (
  <li ref={forwardedRef} {...props} />
));

PaginationItem.displayName = 'PaginationItem';

/* -----------------------------------------------------------------------------
 * Component: PaginationLink
 * -------------------------------------------------------------------------- */

interface PaginationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, Pick<ButtonVariantsProps, 'size'> {
  isActive?: boolean;
}

function PaginationLink({ className, isActive, size, children, ...props }: PaginationLinkProps): React.JSX.Element {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={buttonVariants({
        className,
        icon: true,
        size,
        variant: isActive ? 'outline' : 'ghost',
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
    <PaginationLink aria-label="Go to previous page" className={cn('gap-1 pl-2.5', className)} size="md" {...props}>
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
    <PaginationLink aria-label="Go to next page" className={cn('gap-1 pr-2.5', className)} size="md" {...props}>
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