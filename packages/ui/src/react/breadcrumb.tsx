import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Breadcrumb
 * -------------------------------------------------------------------------- */

type BreadcrumbElement = HTMLElement;

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
}

const Breadcrumb = React.forwardRef<BreadcrumbElement, BreadcrumbProps>(
  ({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />,
);

Breadcrumb.displayName = 'Breadcrumb';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbList
 * -------------------------------------------------------------------------- */

type BreadcrumbListElement = HTMLOListElement;
type BreadcrumbListProps = React.OlHTMLAttributes<HTMLOListElement>;

const BreadcrumbList = React.forwardRef<
  BreadcrumbListElement,
  BreadcrumbListProps
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      'text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5',
      className,
    )}
    {...props}
  />
));

BreadcrumbList.displayName = 'BreadcrumbList';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbItem
 * -------------------------------------------------------------------------- */

type BreadcrumbItemElement = HTMLLIElement;
type BreadcrumbItemProps = React.LiHTMLAttributes<HTMLLIElement>;

const BreadcrumbItem = React.forwardRef<
  BreadcrumbItemElement,
  BreadcrumbItemProps
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  />
));

BreadcrumbItem.displayName = 'BreadcrumbItem';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbLink
 * -------------------------------------------------------------------------- */

type BreadcrumbLinkElement = HTMLAnchorElement;

interface BreadcrumbLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
}

const BreadcrumbLink = React.forwardRef<
  BreadcrumbLinkElement,
  BreadcrumbLinkProps
>(({ asChild, className, ...props }, ref) => {
  const Component = asChild ? Slot : 'a';

  return (
    <Component
      ref={ref}
      className={cn('transition', 'hover:text-foreground', className)}
      {...props}
    />
  );
});

BreadcrumbLink.displayName = 'BreadcrumbLink';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbPage
 * -------------------------------------------------------------------------- */

type BreadcrumbPageElement = HTMLSpanElement;
type BreadcrumbPageProps = React.HTMLAttributes<HTMLSpanElement>;

const BreadcrumbPage = React.forwardRef<
  BreadcrumbPageElement,
  BreadcrumbPageProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('text-foreground font-normal', className)}
    {...props}
  />
));

BreadcrumbPage.displayName = 'BreadcrumbPage';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbSeparator
 * -------------------------------------------------------------------------- */

type BreadcrumbSeparatorProps = React.LiHTMLAttributes<HTMLLIElement>;

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps): React.JSX.Element {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbEllipsis
 * -------------------------------------------------------------------------- */

type BreadcrumbEllipsisProps = React.HTMLAttributes<HTMLSpanElement>;

function BreadcrumbEllipsis({
  className,
  ...props
}: BreadcrumbEllipsisProps): React.JSX.Element {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-4 items-center justify-center', className)}
      {...props}
    >
      <DotsHorizontalIcon className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  type BreadcrumbProps,
  type BreadcrumbListProps,
  type BreadcrumbItemProps,
  type BreadcrumbLinkProps,
  type BreadcrumbPageProps,
  type BreadcrumbSeparatorProps,
  type BreadcrumbEllipsisProps,
};
