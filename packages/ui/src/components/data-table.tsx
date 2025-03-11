'use client';

import type * as ReactTable from '@tanstack/react-table';
import type { ComponentProps, JSX } from 'react';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  EyeOffIcon,
  Settings2Icon,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/select';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: DataTableViewOptions
 * -------------------------------------------------------------------------- */

function DataTableViewOptions<TData>({ table }: { table: ReactTable.Table<TData> }): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ size: 'sm', variant: 'outline' })}>
        <Settings2Icon className="size-4" />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => column.accessorFn !== undefined && column.getCanHide())
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

function DataTablePagination<TData>({
  className,
  table,
  ...props
}: ComponentProps<'div'> & {
  table: ReactTable.Table<TData>;
}): JSX.Element {
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 px-2', className)} {...props}>
      <div className="text-muted-foreground min-w-max flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>

      <div className="flex grow flex-wrap items-center justify-between gap-4 md:justify-end md:gap-x-6 lg:gap-x-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-18 h-8">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4">
          <Button
            className="size-8 max-md:hidden"
            disabled={!table.getCanPreviousPage()}
            size="icon"
            variant="outline"
            onClick={() => {
              table.setPageIndex(0);
            }}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            className="size-8"
            disabled={!table.getCanPreviousPage()}
            size="icon"
            variant="outline"
            onClick={() => {
              table.previousPage();
            }}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            className="size-8"
            disabled={!table.getCanNextPage()}
            size="icon"
            variant="outline"
            onClick={() => {
              table.nextPage();
            }}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            className="size-8 max-md:hidden"
            disabled={!table.getCanNextPage()}
            size="icon"
            variant="outline"
            onClick={() => {
              table.setPageIndex(table.getPageCount() - 1);
            }}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DataTableColumnHeader
 * -------------------------------------------------------------------------- */

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: ReactTable.Column<TData, TValue>;
  title: string;
}): JSX.Element {
  if (!column.getCanSort()) {
    return <>{title}</>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn('hover:not-disabled:bg-initial p-0 text-sm focus-visible:ring-0')}
          size="sm"
          suffix={<SortIcon className="opacity-50" sorted={column.getIsSorted()} />}
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
          <ChevronUpIcon className="size-4 opacity-50" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            column.toggleSorting(true);
          }}
        >
          <ChevronDownIcon className="size-4 opacity-50" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            column.toggleVisibility(false);
          }}
        >
          <EyeOffIcon className="size-4 opacity-50" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortIcon({
  sorted,
  className,
}: {
  sorted: false | ReactTable.SortDirection;
  className?: string;
}): JSX.Element {
  switch (sorted) {
    case 'desc': {
      return <ChevronDownIcon className={className} />;
    }

    case 'asc': {
      return <ChevronUpIcon className={className} />;
    }

    default: {
      return <ChevronsUpDownIcon className={className} />;
    }
  }
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { DataTableColumnHeader, DataTablePagination, DataTableViewOptions };
