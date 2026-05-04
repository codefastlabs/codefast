import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from "lucide-react";

import { buttonVariants } from "#/components/button";

/* -----------------------------------------------------------------------------
 * Component: Pagination
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PaginationProps = ComponentProps<"nav">;

/**
 * @since 0.3.16-canary.0
 */
function Pagination({ className, ...props }: PaginationProps): JSX.Element {
  return (
    <nav
      aria-label="pagination"
      className={cn("flex w-full justify-center", "mx-auto", className)}
      data-slot="pagination"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PaginationContentProps = ComponentProps<"ul">;

/**
 * @since 0.3.16-canary.0
 */
function PaginationContent({ className, ...props }: PaginationContentProps): JSX.Element {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type PaginationItemProps = ComponentProps<"li">;

/**
 * @since 0.3.16-canary.0
 */
function PaginationItem(props: PaginationItemProps): JSX.Element {
  return <li data-slot="pagination-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PaginationLink
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface PaginationLinkProps
  extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function PaginationLink({
  children,
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps): JSX.Element {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={buttonVariants({ className, size, variant: isActive ? "outline" : "ghost" })}
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

/**
 * @since 0.3.16-canary.0
 */
interface PaginationPreviousProps
  extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function PaginationPrevious({ ...props }: PaginationPreviousProps): JSX.Element {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      data-slot="pagination-previous"
      size="md"
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

/**
 * @since 0.3.16-canary.0
 */
interface PaginationNextProps
  extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function PaginationNext({ ...props }: PaginationNextProps): JSX.Element {
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

/**
 * @since 0.3.16-canary.0
 */
type PaginationEllipsisProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps): JSX.Element {
  return (
    <span
      aria-hidden
      className={cn("flex size-10 items-center justify-center", className)}
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
export type {
  PaginationContentProps,
  PaginationEllipsisProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationNextProps,
  PaginationPreviousProps,
  PaginationProps,
};
