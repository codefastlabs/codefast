import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';

import {
  Button,
  Checkbox,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableViewOptions,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from '@codefast/ui';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import data from '@/mocks/data-table.json';

const meta = {
  tags: ['autodocs'],
  title: 'UI/Data Table',
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof Table>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

interface Payment {
  amount: number;
  email: string;
  id: string;
  status: 'failed' | 'pending' | 'processing' | 'success';
}

const payments = data as Payment[];

const columns: ColumnDef<Payment>[] = [
  {
    id: 'select',
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(Boolean(value));
        }}
      />
    ),
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(Boolean(value));
        }}
      />
    ),
  },
  {
    accessorKey: 'status',
    cell: ({ row }) => <div className="capitalize">{row.getValue('status')}</div>,
    header: 'Status',
  },
  {
    accessorKey: 'email',
    cell: ({ row }) => <div className="lowercase">{row.getValue('email')}</div>,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: 'amount',
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue('amount'));

      const formatted = new Intl.NumberFormat('en-US', {
        currency: 'USD',
        style: 'currency',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
    header: () => <div className="text-right">Amount</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon size="xs" suffix={<DotsHorizontalIcon />} variant="ghost">
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  void navigator.clipboard.writeText(payment.id);
                }}
              >
                Copy payment ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableHiding: false,
    meta: {},
  },
];

export const Default: Story = {
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const table = useReactTable({
      columns,
      data: payments,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      state: {
        columnFilters,
        columnVisibility,
        rowSelection,
        sorting,
      },
    });

    return (
      <div className="w-full">
        <div className="flex items-center gap-4 py-4">
          <div className="flex grow items-center">
            <TextInput
              className="max-w-sm"
              inputSize="xs"
              placeholder="Filter emails..."
              prefix={<SearchIcon className="text-muted-foreground" />}
              value={String(table.getColumn('email')?.getFilterValue() ?? '')}
              onChange={(event) => table.getColumn('email')?.setFilterValue(event.target.value)}
            />
          </div>
          <DataTableViewOptions table={table} />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan={columns.length}>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          </Table>
        </div>
        <DataTablePagination className="py-4" table={table} />
      </div>
    );
  },
};
