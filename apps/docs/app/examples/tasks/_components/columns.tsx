'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { Badge, Checkbox, DataTableColumnHeader } from '@codefast/ui';

import type { Task } from '@/app/examples/tasks/_data/schema';

import { DataTableRowActions } from '@/app/examples/tasks/_components/data-table-row-actions';
import { labels, priorities, statuses } from '@/app/examples/tasks/_data/data';

export const columns: ColumnDef<Task>[] = [
  {
    id: 'select',
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        className="translate-y-0.5"
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
        className="translate-y-0.5"
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(Boolean(value));
        }}
      />
    ),
  },
  {
    accessorKey: 'id',
    cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
    enableHiding: false,
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
  },
  {
    accessorKey: 'title',
    cell: ({ row }) => {
      const label = labels.find(({ value }) => value === row.original.label);

      return (
        <div className="flex items-center gap-x-2">
          {label ? <Badge variant="outline">{label.label}</Badge> : null}
          <span className="max-w-[500px] truncate font-medium">{row.getValue('title')}</span>
        </div>
      );
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
  },
  {
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = statuses.find(({ value }) => value === row.getValue('status'));

      if (!status) {
        return null;
      }

      const { icon: Icon } = status;

      return (
        <div className="flex w-[100px] items-center">
          <Icon className="text-muted-foreground mr-2 size-4" />
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value: string) => value.includes(row.getValue(id)),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: 'priority',
    cell: ({ row }) => {
      const priority = priorities.find(({ value }) => value === row.getValue('priority'));

      if (!priority) {
        return null;
      }

      const { icon: Icon } = priority;

      return (
        <div className="flex items-center">
          <Icon className="text-muted-foreground mr-2 size-4" />
          <span>{priority.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value: string) => value.includes(row.getValue(id)),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
