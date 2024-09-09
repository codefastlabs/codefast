import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Breadcrumb
 * -------------------------------------------------------------------------- */

type BreadcrumbElement = HTMLElement;

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
}

const Breadcrumb = React.forwardRef<BreadcrumbElement, BreadcrumbProps>(({ ...props }, forwardedRef) => (
  <nav ref={forwardedRef} aria-label="breadcrumb" {...props} />
));

Breadcrumb.displayName = 'Breadcrumb';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbList
 * -------------------------------------------------------------------------- */

type BreadcrumbListElement = HTMLOListElement;
type BreadcrumbListProps = React.OlHTMLAttributes<HTMLOListElement>;

const BreadcrumbList = React.forwardRef<BreadcrumbListElement, BreadcrumbListProps>(
  ({ className, ...props }, forwardedRef) => (
    <ol
      ref={forwardedRef}
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5',
        className,
      )}
      {...props}
    />
  ),
);

BreadcrumbList.displayName = 'BreadcrumbList';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbItem
 * -------------------------------------------------------------------------- */

type BreadcrumbItemElement = HTMLLIElement;
type BreadcrumbItemProps = React.LiHTMLAttributes<HTMLLIElement>;

const BreadcrumbItem = React.forwardRef<BreadcrumbItemElement, BreadcrumbItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <li ref={forwardedRef} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  ),
);

BreadcrumbItem.displayName = 'BreadcrumbItem';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbLink
 * -------------------------------------------------------------------------- */

type BreadcrumbLinkElement = HTMLAnchorElement;

interface BreadcrumbLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
}

const BreadcrumbLink = React.forwardRef<BreadcrumbLinkElement, BreadcrumbLinkProps>(
  ({ asChild, className, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : 'a';

    return <Component ref={forwardedRef} className={cn('hover:text-foreground transition', className)} {...props} />;
  },
);

BreadcrumbLink.displayName = 'BreadcrumbLink';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbPage
 * -------------------------------------------------------------------------- */

type BreadcrumbPageElement = HTMLSpanElement;
type BreadcrumbPageProps = React.HTMLAttributes<HTMLSpanElement>;

const BreadcrumbPage = React.forwardRef<BreadcrumbPageElement, BreadcrumbPageProps>(
  ({ className, ...props }, forwardedRef) => (
    <span
      ref={forwardedRef}
      aria-current="page"
      aria-disabled="true"
      className={cn('text-foreground font-normal', className)}
      role="link"
      {...props}
    />
  ),
);

BreadcrumbPage.displayName = 'BreadcrumbPage';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbSeparator
 * -------------------------------------------------------------------------- */

type BreadcrumbSeparatorProps = React.LiHTMLAttributes<HTMLLIElement>;

function BreadcrumbSeparator({ children, className, ...props }: BreadcrumbSeparatorProps): React.JSX.Element {
  return (
    <li aria-hidden="true" className={cn('[&_svg]:size-3.5', className)} role="presentation" {...props}>
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbEllipsis
 * -------------------------------------------------------------------------- */

type BreadcrumbEllipsisProps = React.HTMLAttributes<HTMLSpanElement>;

function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-4 items-center justify-center', className)}
      role="presentation"
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
