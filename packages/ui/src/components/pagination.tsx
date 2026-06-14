import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "#/lib/utils";
import { cn } from "#/lib/utils";
import { buttonVariants } from "#/variants/button";

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
      className={cn("mx-auto flex w-full justify-center", className)}
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
  return <ul className={cn("flex items-center gap-1", className)} data-slot="pagination-content" {...props} />;
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
interface PaginationLinkProps extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function PaginationLink({ children, className, isActive, size = "icon", ...props }: PaginationLinkProps): JSX.Element {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={buttonVariants({ className, size, variant: isActive ? "outline" : "ghost" })}
      data-active={isActive}
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
interface PaginationPreviousProps extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
  text?: string;
}

/**
 * @since 0.3.16-canary.0
 */
function PaginationPrevious({ className, text = "Previous", ...props }: PaginationPreviousProps): JSX.Element {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("ps-2!", className)}
      data-slot="pagination-previous"
      size="default"
      {...props}
    >
      <ChevronLeftIcon className="rtl:rotate-180" data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

/* -----------------------------------------------------------------------------
 * Component: PaginationNext
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface PaginationNextProps extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
  text?: string;
}

/**
 * @since 0.3.16-canary.0
 */
function PaginationNext({ className, text = "Next", ...props }: PaginationNextProps): JSX.Element {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("pe-2!", className)}
      data-slot="pagination-next"
      size="default"
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon className="rtl:rotate-180" data-icon="inline-end" />
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
      className={cn("flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon />
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
