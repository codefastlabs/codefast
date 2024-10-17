'use client';

import {
  CaretSortIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  EyeNoneIcon,
  MixerHorizontalIcon,
} from '@radix-ui/react-icons';
import type * as ReactTable from '@tanstack/react-table';
import { type HTMLAttributes, type JSX } from 'react';

import { Button } from '@/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/select';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/styles/button-variants';

/* -----------------------------------------------------------------------------
 * Component: DataTableViewOptions
 * -------------------------------------------------------------------------- */

interface DataTableViewOptionsProps<TData> {
  table: ReactTable.Table<TData>;
}

function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ size: 'xs', variant: 'outline' })}
      >
        <MixerHorizontalIcon className="size-4" />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide(),
          )
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

interface DataTablePaginationProps<TData>
  extends HTMLAttributes<HTMLDivElement> {
  table: ReactTable.Table<TData>;
}

function DataTablePagination<TData>({
  table,
  className,
  ...props
}: DataTablePaginationProps<TData>): JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 px-2',
        className,
      )}
      {...props}
    >
      <div className="text-muted-foreground min-w-max flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>

      <div className="flex grow flex-wrap items-center justify-between gap-4 md:justify-end md:gap-x-6 lg:gap-x-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4">
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
        <div className="flex flex-wrap items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4">
          <Button
            icon
            className="max-md:hidden"
            disabled={!table.getCanPreviousPage()}
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
            icon
            disabled={!table.getCanPreviousPage()}
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
            icon
            disabled={!table.getCanNextPage()}
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
            icon
            className="max-md:hidden"
            disabled={!table.getCanNextPage()}
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

interface DataTableColumnHeaderProps<TData, TValue> {
  column: ReactTable.Column<TData, TValue>;
  title: string;
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>): JSX.Element {
  if (!column.getCanSort()) {
    return <>{title}</>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            'text-muted-foreground p-0',
            'hover:bg-transparent',
            'data-[state=open]:text-accent-foreground',
            'focus-visible:text-accent-foreground focus-visible:bg-transparent focus-visible:outline-0',
          )}
          size="xs"
          suffix={<SortIcon sorted={column.getIsSorted()} />}
          variant="ghost"
        >
          {title}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => {
            column.toggleSorting(false);
          }}
        >
          <ChevronUpIcon className="text-muted-foreground" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            column.toggleSorting(true);
          }}
        >
          <ChevronDownIcon className="text-muted-foreground" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            column.toggleVisibility(false);
          }}
        >
          <EyeNoneIcon className="text-muted-foreground" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortIcon({
  sorted,
}: {
  sorted: false | ReactTable.SortDirection;
}): JSX.Element {
  switch (sorted) {
    case 'desc': {
      return <ChevronDownIcon />;
    }

    case 'asc': {
      return <ChevronUpIcon />;
    }

    default:
      return <CaretSortIcon />;
  }
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  type DataTableColumnHeaderProps,
  type DataTablePaginationProps,
  type DataTableViewOptionsProps,
};
