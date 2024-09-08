'use client';

import * as React from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  EyeNoneIcon,
  MixerHorizontalIcon,
} from '@radix-ui/react-icons';
import type * as ReactTable from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import { Button, buttonVariants } from '@/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/select';

/* -----------------------------------------------------------------------------
 * Component: DataTableViewOptions
 * -------------------------------------------------------------------------- */

interface DataTableViewOptionsProps<TData> {
  table: ReactTable.Table<TData>;
}

function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ className: 'hidden h-8 lg:flex', size: 'sm', variant: 'outline' })}
      >
        <MixerHorizontalIcon className="size-4" />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              className="capitalize"
              onCheckedChange={(value) => {
                column.toggleVisibility(Boolean(value));
              }}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DataTablePagination
 * -------------------------------------------------------------------------- */

interface DataTablePaginationProps<TData> extends React.HTMLAttributes<HTMLDivElement> {
  table: ReactTable.Table<TData>;
}

function DataTablePagination<TData>({
  table,
  className,
  ...props
}: DataTablePaginationProps<TData>): React.JSX.Element {
  return (
    <div className={cn('flex items-center justify-between px-2', className)} {...props}>
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-18 h-8">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-28 items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            className="hidden lg:flex"
            disabled={!table.getCanPreviousPage()}
            shape="square"
            size="xs"
            variant="outline"
            onClick={() => {
              table.setPageIndex(0);
            }}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="size-4" />
          </Button>
          <Button
            disabled={!table.getCanPreviousPage()}
            shape="square"
            size="xs"
            variant="outline"
            onClick={() => {
              table.previousPage();
            }}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            shape="square"
            size="xs"
            variant="outline"
            onClick={() => {
              table.nextPage();
            }}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            className="hidden lg:flex"
            disabled={!table.getCanNextPage()}
            shape="square"
            size="xs"
            variant="outline"
            onClick={() => {
              table.setPageIndex(table.getPageCount() - 1);
            }}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DataTableColumnHeader
 * -------------------------------------------------------------------------- */

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: ReactTable.Column<TData, TValue>;
  title: string;
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>): React.JSX.Element {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="data-[state=open]:bg-accent -ml-3" size="xs" variant="ghost">
            <span>{title}</span>
            <SortIcon sorted={column.getIsSorted()} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => {
              column.toggleSorting(false);
            }}
          >
            <ArrowUpIcon className="text-muted-foreground/70 mr-2 size-3.5" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              column.toggleSorting(true);
            }}
          >
            <ArrowDownIcon className="text-muted-foreground/70 mr-2 size-3.5" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              column.toggleVisibility(false);
            }}
          >
            <EyeNoneIcon className="text-muted-foreground/70 mr-2 size-3.5" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SortIcon({ sorted }: { sorted: false | ReactTable.SortDirection }): React.JSX.Element {
  switch (sorted) {
    case 'desc': {
      return <ArrowDownIcon className="ml-2 size-4" />;
    }

    case 'asc': {
      return <ArrowUpIcon className="ml-2 size-4" />;
    }

    default:
      return <CaretSortIcon className="ml-2 size-4" />;
  }
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  DataTableViewOptions,
  DataTablePagination,
  DataTableColumnHeader,
  type DataTableViewOptionsProps,
  type DataTablePaginationProps,
  type DataTableColumnHeaderProps,
};
