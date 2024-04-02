"use client";

import * as React from "react";
import type * as ReactTable from "@tanstack/react-table";
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
} from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: DataTableViewOptions
 * -------------------------------------------------------------------------- */

interface DataTableViewOptionsProps<TData> {
  table: ReactTable.Table<TData>;
}
function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 size-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide(),
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => {
                  column.toggleVisibility(Boolean(value));
                }}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -----------------------------------------------------------------------------
 * Component: DataTablePagination
 * -------------------------------------------------------------------------- */

interface DataTablePaginationProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: ReactTable.Table<TData>;
}
function DataTablePagination<TData>({
  table,
  className,
  ...props
}: DataTablePaginationProps<TData>): React.JSX.Element {
  return (
    <div
      className={cn("flex items-center justify-between px-2", className)}
      {...props}
    >
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon-xs"
            className="hidden  lg:flex"
            onClick={() => {
              table.setPageIndex(0);
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => {
              table.previousPage();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => {
              table.nextPage();
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            className="hidden  lg:flex"
            onClick={() => {
              table.setPageIndex(table.getPageCount() - 1);
            }}
            disabled={!table.getCanNextPage()}
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

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: ReactTable.Column<TData, TValue>;
  title: string;
}
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>): React.JSX.Element {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="xs"
            className="data-[state=open]:bg-accent -ml-3"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 size-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 size-4" />
            ) : (
              <CaretSortIcon className="ml-2 size-4" />
            )}
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

export * from "@tanstack/react-table";
