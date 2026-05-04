import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Table
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableProps = ComponentProps<"table">;

/**
 * @since 0.3.16-canary.0
 */
function Table({ className, ...props }: TableProps): JSX.Element {
  return (
    <div className={cn("relative", "w-full overflow-auto")} data-slot="table-cotainer">
      <table
        className={cn("w-full text-sm", "caption-bottom", className)}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableHeader
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableHeaderProps = ComponentProps<"thead">;

/**
 * @since 0.3.16-canary.0
 */
function TableHeader({ className, ...props }: TableHeaderProps): JSX.Element {
  return (
    <thead
      className={cn("*:border-b", "*:has-aria-expanded:bg-transparent", className)}
      data-slot="table-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableBody
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableBodyProps = ComponentProps<"tbody">;

/**
 * @since 0.3.16-canary.0
 */
function TableBody({ className, ...props }: TableBodyProps): JSX.Element {
  return (
    <tbody className={cn("*:last-child:border-0", className)} data-slot="table-body" {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableFooter
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableFooterProps = ComponentProps<"tfoot">;

/**
 * @since 0.3.16-canary.0
 */
function TableFooter({ className, ...props }: TableFooterProps): JSX.Element {
  return (
    <tfoot
      className={cn(
        "bg-muted/50 font-medium",
        "*:border-t *:border-b-0",
        "*:has-aria-expanded:bg-transparent",
        className,
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableRow
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableRowProps = ComponentProps<"tr">;

/**
 * @since 0.3.16-canary.0
 */
function TableRow({ className, ...props }: TableRowProps): JSX.Element {
  return (
    <tr
      className={cn(
        "border-b",
        "transition-colors",
        "hover:bg-muted/50",
        "has-aria-expanded:bg-muted/50",
        "data-selected:bg-muted",
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableHead
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableHeadProps = ComponentProps<"th">;

/**
 * @since 0.3.16-canary.0
 */
function TableHead({ className, ...props }: TableHeadProps): JSX.Element {
  return (
    <th
      className={cn("p-2", "text-left align-middle font-medium", className)}
      data-slot="table-head"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableCell
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableCellProps = ComponentProps<"td">;

/**
 * @since 0.3.16-canary.0
 */
function TableCell({ className, ...props }: TableCellProps): JSX.Element {
  return <td className={cn("p-2", "align-middle", className)} data-slot="table-cell" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableCaption
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type TableCaptionProps = ComponentProps<"caption">;

/**
 * @since 0.3.16-canary.0
 */
function TableCaption({ className, ...props }: TableCaptionProps): JSX.Element {
  return (
    <caption
      className={cn("mt-4", "text-sm text-muted-foreground", className)}
      data-slot="table-caption"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
export type {
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableFooterProps,
  TableHeaderProps,
  TableHeadProps,
  TableProps,
  TableRowProps,
};
