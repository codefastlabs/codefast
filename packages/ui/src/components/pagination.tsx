import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from 'lucide-react';
import { type AnchorHTMLAttributes, forwardRef, type HTMLAttributes, type JSX, type LiHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariantsProps } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: Pagination
 * -------------------------------------------------------------------------- */

type PaginationProps = HTMLAttributes<HTMLElement>;

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

type PaginationContentElement = HTMLUListElement;
type PaginationContentProps = HTMLAttributes<HTMLUListElement>;

const PaginationContent = forwardRef<PaginationContentElement, PaginationContentProps>(
  ({ className, ...props }, forwardedRef) => (
    <ul ref={forwardedRef} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  ),
);

PaginationContent.displayName = 'PaginationContent';

/* -----------------------------------------------------------------------------
 * Component: PaginationItem
 * -------------------------------------------------------------------------- */

type PaginationItemElement = HTMLLIElement;
type PaginationItemProps = LiHTMLAttributes<HTMLLIElement>;

const PaginationItem = forwardRef<PaginationItemElement, PaginationItemProps>((props, forwardedRef) => (
  <li ref={forwardedRef} {...props} />
));

PaginationItem.displayName = 'PaginationItem';

/* -----------------------------------------------------------------------------
 * Component: PaginationLink
 * -------------------------------------------------------------------------- */

interface PaginationLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    Pick<ButtonVariantsProps, 'icon' | 'size'> {
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
      className={buttonVariants({
        className,
        icon,
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

type PaginationEllipsisProps = HTMLAttributes<HTMLSpanElement>;

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

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  type PaginationContentProps,
  type PaginationEllipsisProps,
  type PaginationItemProps,
  type PaginationLinkProps,
  type PaginationNextProps,
  type PaginationPreviousProps,
  type PaginationProps,
};
