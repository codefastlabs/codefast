import { cn } from '@/lib/utils';
import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';

/* -----------------------------------------------------------------------------
 * Component: Table
 * -------------------------------------------------------------------------- */

type TableElement = HTMLTableElement;
type TableProps = HTMLAttributes<HTMLTableElement>;

const Table = forwardRef<TableElement, TableProps>(
  ({ className, ...props }, forwardedRef) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={forwardedRef}
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
type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

const TableHeader = forwardRef<TableHeaderElement, TableHeaderProps>(
  ({ className, ...props }, forwardedRef) => (
    <thead
      ref={forwardedRef}
      className={cn('[&>tr]:border-b [&>tr]:hover:bg-transparent', className)}
      {...props}
    />
  ),
);

TableHeader.displayName = 'TableHeader';

/* -----------------------------------------------------------------------------
 * Component: TableBody
 * -------------------------------------------------------------------------- */

type TableBodyElement = HTMLTableSectionElement;
type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

const TableBody = forwardRef<TableBodyElement, TableBodyProps>(
  ({ className, ...props }, forwardedRef) => (
    <tbody
      ref={forwardedRef}
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
type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

const TableFooter = forwardRef<TableFooterElement, TableFooterProps>(
  ({ className, ...props }, forwardedRef) => (
    <tfoot
      ref={forwardedRef}
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
type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

const TableRow = forwardRef<TableRowElement, TableRowProps>(
  ({ className, ...props }, forwardedRef) => (
    <tr
      ref={forwardedRef}
      className={cn(
        'border-b transition',
        'hover:bg-accent',
        'data-[state=selected]:bg-muted',
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
type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;

const TableHead = forwardRef<TableHeadElement, TableHeadProps>(
  ({ className, ...props }, forwardedRef) => (
    <th
      ref={forwardedRef}
      className={cn(
        'text-muted-foreground p-2 text-left align-middle font-medium',
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
type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

const TableCell = forwardRef<TableCellElement, TableCellProps>(
  ({ className, ...props }, forwardedRef) => (
    <td
      ref={forwardedRef}
      className={cn('p-2 align-middle', className)}
      {...props}
    />
  ),
);

TableCell.displayName = 'TableCell';

/* -----------------------------------------------------------------------------
 * Component: TableCaption
 * -------------------------------------------------------------------------- */

type TableCaptionElement = HTMLTableCaptionElement;
type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

const TableCaption = forwardRef<TableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, forwardedRef) => (
    <caption
      ref={forwardedRef}
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
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  type TableBodyProps,
  type TableCaptionProps,
  type TableCellProps,
  type TableFooterProps,
  type TableHeaderProps,
  type TableHeadProps,
  type TableProps,
  type TableRowProps,
};
