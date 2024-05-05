import * as React from 'react';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Table
 * -------------------------------------------------------------------------- */

type TableElement = HTMLTableElement;
type TableProps = React.HTMLAttributes<HTMLTableElement>;

const Table = React.forwardRef<TableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  ),
);

Table.displayName = 'Table';

/* -----------------------------------------------------------------------------
 * Component: TableHeader
 * -------------------------------------------------------------------------- */

type TableHeaderElement = HTMLTableSectionElement;
type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableHeader = React.forwardRef<TableHeaderElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  ),
);

TableHeader.displayName = 'TableHeader';

/* -----------------------------------------------------------------------------
 * Component: TableBody
 * -------------------------------------------------------------------------- */

type TableBodyElement = HTMLTableSectionElement;
type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableBody = React.forwardRef<TableBodyElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  ),
);

TableBody.displayName = 'TableBody';

/* -----------------------------------------------------------------------------
 * Component: TableFooter
 * -------------------------------------------------------------------------- */

type TableFooterElement = HTMLTableSectionElement;
type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableFooter = React.forwardRef<TableFooterElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  ),
);

TableFooter.displayName = 'TableFooter';

/* -----------------------------------------------------------------------------
 * Component: TableRow
 * -------------------------------------------------------------------------- */

type TableRowElement = HTMLTableRowElement;
type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

const TableRow = React.forwardRef<TableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition',
        className,
      )}
      {...props}
    />
  ),
);

TableRow.displayName = 'TableRow';

/* -----------------------------------------------------------------------------
 * Component: TableHead
 * -------------------------------------------------------------------------- */

type TableHeadElement = HTMLTableCellElement;
type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

const TableHead = React.forwardRef<TableHeadElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'text-muted-foreground h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
);

TableHead.displayName = 'TableHead';

/* -----------------------------------------------------------------------------
 * Component: TableCell
 * -------------------------------------------------------------------------- */

type TableCellElement = HTMLTableCellElement;
type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

const TableCell = React.forwardRef<TableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
);

TableCell.displayName = 'TableCell';

/* -----------------------------------------------------------------------------
 * Component: TableCaption
 * -------------------------------------------------------------------------- */

type TableCaptionElement = HTMLTableCaptionElement;
type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

const TableCaption = React.forwardRef<TableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  ),
);

TableCaption.displayName = 'TableCaption';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  type TableProps,
  type TableHeaderProps,
  type TableBodyProps,
  type TableFooterProps,
  type TableHeadProps,
  type TableRowProps,
  type TableCellProps,
  type TableCaptionProps,
};
