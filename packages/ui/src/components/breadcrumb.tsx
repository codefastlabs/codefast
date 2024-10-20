import { ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import {
  type AnchorHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type JSX,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Breadcrumb
 * -------------------------------------------------------------------------- */

type BreadcrumbElement = HTMLElement;

interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  separator?: ReactNode;
}

const Breadcrumb = forwardRef<BreadcrumbElement, BreadcrumbProps>(({ ...props }, forwardedRef) => (
  <nav ref={forwardedRef} aria-label="breadcrumb" {...props} />
));

Breadcrumb.displayName = 'Breadcrumb';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbList
 * -------------------------------------------------------------------------- */

type BreadcrumbListElement = HTMLOListElement;
type BreadcrumbListProps = OlHTMLAttributes<HTMLOListElement>;

const BreadcrumbList = forwardRef<BreadcrumbListElement, BreadcrumbListProps>(
  ({ className, ...props }, forwardedRef) => (
    <ol
      ref={forwardedRef}
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2',
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
type BreadcrumbItemProps = LiHTMLAttributes<HTMLLIElement>;

const BreadcrumbItem = forwardRef<BreadcrumbItemElement, BreadcrumbItemProps>(
  ({ className, ...props }, forwardedRef) => (
    <li ref={forwardedRef} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  ),
);

BreadcrumbItem.displayName = 'BreadcrumbItem';

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbLink
 * -------------------------------------------------------------------------- */

type BreadcrumbLinkElement = HTMLAnchorElement;

interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
}

const BreadcrumbLink = forwardRef<BreadcrumbLinkElement, BreadcrumbLinkProps>(
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
type BreadcrumbPageProps = HTMLAttributes<HTMLSpanElement>;

const BreadcrumbPage = forwardRef<BreadcrumbPageElement, BreadcrumbPageProps>(
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

type BreadcrumbSeparatorProps = LiHTMLAttributes<HTMLLIElement>;

function BreadcrumbSeparator({ children, ...props }: BreadcrumbSeparatorProps): JSX.Element {
  return (
    <li aria-hidden="true" role="presentation" {...props}>
      {children ?? <ChevronRightIcon className="size-3.5" />}
    </li>
  );
}

/* -----------------------------------------------------------------------------
 * Component: BreadcrumbEllipsis
 * -------------------------------------------------------------------------- */

type BreadcrumbEllipsisProps = HTMLAttributes<HTMLSpanElement>;

function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps): JSX.Element {
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
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type BreadcrumbEllipsisProps,
  type BreadcrumbItemProps,
  type BreadcrumbLinkProps,
  type BreadcrumbListProps,
  type BreadcrumbPageProps,
  type BreadcrumbProps,
  type BreadcrumbSeparatorProps,
};
