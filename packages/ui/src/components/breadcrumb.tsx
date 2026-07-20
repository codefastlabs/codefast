import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import * as Slot from "radix-ui/slot";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Breadcrumb
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type BreadcrumbProps = ComponentProps<"nav">;

/**
 * @since 0.3.16-canary.0
 */
function Breadcrumb({ ...props }: BreadcrumbProps): JSX.Element {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbList
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type BreadcrumbListProps = ComponentProps<"ol">;

/**
 * @since 0.3.16-canary.0
 */
function BreadcrumbList({ className, ...props }: BreadcrumbListProps): JSX.Element {
  return (
    <ol
      className={cn("flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground", className)}
      data-slot="breadcrumb-list"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type BreadcrumbItemProps = ComponentProps<"li">;

/**
 * @since 0.3.16-canary.0
 */
function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps): JSX.Element {
  return <li className={cn("inline-flex items-center gap-1", className)} data-slot="breadcrumb-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbLink
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface BreadcrumbLinkProps extends ComponentProps<"a"> {
  asChild?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps): JSX.Element {
  const Component = asChild ? Slot.Root : "a";

  return (
    <Component
      className={cn("transition-colors hover:text-foreground", className)}
      data-slot="breadcrumb-link"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbPage
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type BreadcrumbPageProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps): JSX.Element {
  return (
    <span
      aria-current="page"
      aria-disabled="true"
      className={cn("font-normal text-foreground", className)}
      data-slot="breadcrumb-page"
      role="link"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type BreadcrumbSeparatorProps = ComponentProps<"li">;

/**
 * @since 0.3.16-canary.0
 */
function BreadcrumbSeparator({ children, className, ...props }: BreadcrumbSeparatorProps): JSX.Element {
  return (
    <li
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRightIcon className="rtl:rotate-180" />}
    </li>
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbEllipsis
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type BreadcrumbEllipsisProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-5 items-center justify-center [&>svg]:size-4", className)}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More</span>
    </span>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
export type {
  BreadcrumbEllipsisProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbListProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparatorProps,
};
