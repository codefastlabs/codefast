import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Table
 * -------------------------------------------------------------------------- */

type TableProps = ComponentProps<'table'>;

function Table({ className, ...props }: TableProps): JSX.Element {
  return (
    <div className="relative w-full overflow-auto" data-slot="table-cotainer">
      <table className={cn('w-full caption-bottom text-sm', className)} data-slot="table" {...props} />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableHeader
 * -------------------------------------------------------------------------- */

type TableHeaderProps = ComponentProps<'thead'>;

function TableHeader({ className, ...props }: TableHeaderProps): JSX.Element {
  return (
    <thead
      className={cn('[&>tr]:has-aria-expanded:bg-transparent [&>tr]:border-b [&>tr]:hover:bg-transparent', className)}
      data-slot="table-header"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableBody
 * -------------------------------------------------------------------------- */

type TableBodyProps = ComponentProps<'tbody'>;

function TableBody({ className, ...props }: TableBodyProps): JSX.Element {
  return <tbody className={cn('[&>tr:last-child]:border-0', className)} data-slot="table-body" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableFooter
 * -------------------------------------------------------------------------- */

type TableFooterProps = ComponentProps<'tfoot'>;

function TableFooter({ className, ...props }: TableFooterProps): JSX.Element {
  return (
    <tfoot
      className={cn(
        '[&>tr]:has-aria-expanded:bg-transparent [&>tr]:border-b-0 [&>tr]:border-t [&>tr]:hover:bg-transparent',
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

type TableRowProps = ComponentProps<'tr'>;

function TableRow({ className, ...props }: TableRowProps): JSX.Element {
  return (
    <tr
      className={cn(
        'hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b',
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

type TableHeadProps = ComponentProps<'th'>;

function TableHead({ className, ...props }: TableHeadProps): JSX.Element {
  return (
    <th
      className={cn('text-muted-foreground p-2 text-left align-middle font-medium', className)}
      data-slot="table-head"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: TableCell
 * -------------------------------------------------------------------------- */

type TableCellProps = ComponentProps<'td'>;

function TableCell({ className, ...props }: TableCellProps): JSX.Element {
  return <td className={cn('p-2 align-middle', className)} data-slot="table-cell" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TableCaption
 * -------------------------------------------------------------------------- */

type TableCaptionProps = ComponentProps<'caption'>;

function TableCaption({ className, ...props }: TableCaptionProps): JSX.Element {
  return (
    <caption className={cn('text-muted-foreground mt-4 text-sm', className)} data-slot="table-caption" {...props} />
  );
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
