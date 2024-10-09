'use client';

import { Badge, Checkbox, DataTableColumnHeader } from '@codefast/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { labels, priorities, statuses } from '@/app/examples/tasks/_data/data';
import { DataTableRowActions } from '@/app/examples/tasks/_components/data-table-row-actions';
import { type Task } from '@/app/examples/tasks/_data/schema';

export const columns: ColumnDef<Task>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        className="translate-y-0.5"
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(Boolean(value));
        }}
      />
    ),
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
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Task" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const label = labels.find(({ value }) => value === row.original.label);

      return (
        <div className="flex items-center gap-x-2">
          {label ? (
            <Badge size="sm" variant="outline">
              {label.label}
            </Badge>
          ) : null}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue('title')}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        ({ value }) => value === row.getValue('status'),
      );

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
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = priorities.find(
        ({ value }) => value === row.getValue('priority'),
      );

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
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
