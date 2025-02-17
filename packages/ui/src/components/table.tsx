import type { HTMLAttributes, JSX, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Table
 * -------------------------------------------------------------------------- */

type TableProps = HTMLAttributes<HTMLTableElement>;

function Table({ className, ...props }: TableProps): JSX.Element {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableHeader
 * -------------------------------------------------------------------------- */

type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

function TableHeader({ className, ...props }: TableHeaderProps): JSX.Element {
  return (
    <thead className={cn('[&>tr]:border-b [&>tr]:hover:bg-transparent', className)} {...props} />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableBody
 * -------------------------------------------------------------------------- */

type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

function TableBody({ className, ...props }: TableBodyProps): JSX.Element {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableFooter
 * -------------------------------------------------------------------------- */

type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

function TableFooter({ className, ...props }: TableFooterProps): JSX.Element {
  return (
    <tfoot
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableRow
 * -------------------------------------------------------------------------- */

type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

function TableRow({ className, ...props }: TableRowProps): JSX.Element {
  return (
    <tr
      className={cn(
        'border-b transition',
        'hover:bg-accent',
        'data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableHead
 * -------------------------------------------------------------------------- */

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;

function TableHead({ className, ...props }: TableHeadProps): JSX.Element {
  return (
    <th
      className={cn('text-muted-foreground p-2 text-left align-middle font-medium', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableCell
 * -------------------------------------------------------------------------- */

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

function TableCell({ className, ...props }: TableCellProps): JSX.Element {
  return <td className={cn('p-2 align-middle', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableCaption
 * -------------------------------------------------------------------------- */

type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

function TableCaption({ className, ...props }: TableCaptionProps): JSX.Element {
  return <caption className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

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
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
