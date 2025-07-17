import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import type { VariantProps } from "@/lib/utils";

import { buttonVariants } from "@/components/button/button.variants";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Pagination
 * -------------------------------------------------------------------------- */

type PaginationProps = ComponentProps<"nav">;

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

type PaginationContentProps = ComponentProps<"ul">;

function PaginationContent({ className, ...props }: PaginationContentProps): JSX.Element {
  return <ul className={cn("flex flex-row items-center gap-1", className)} data-slot="pagination-content" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PaginationItem
 * -------------------------------------------------------------------------- */

type PaginationItemProps = ComponentProps<"li">;

function PaginationItem(props: PaginationItemProps): JSX.Element {
  return <li data-slot="pagination-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PaginationLink
 * -------------------------------------------------------------------------- */

interface PaginationLinkProps extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
}

function PaginationLink({ children, className, isActive, size = "icon", ...props }: PaginationLinkProps): JSX.Element {
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

interface PaginationPreviousProps extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
}

function PaginationPrevious({ ...props }: PaginationPreviousProps): JSX.Element {
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

interface PaginationNextProps extends ComponentProps<"a">, Pick<VariantProps<typeof buttonVariants>, "size"> {
  isActive?: boolean;
}

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

type PaginationEllipsisProps = ComponentProps<"span">;

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
