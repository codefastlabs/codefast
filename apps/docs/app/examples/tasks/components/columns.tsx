"use client";

import { Badge } from "@codefast/ui/badge";
import { Checkbox } from "@codefast/ui/checkbox";
import { DataTableColumnHeader } from "@codefast/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { type Task } from "@/app/examples/tasks/data/schema";
import { labels, priorities, statuses } from "@/app/examples/tasks/data/data";
import { DataTableRowActions } from "@/app/examples/tasks/components/data-table-row-actions";

export const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(Boolean(value));
        }}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(Boolean(value));
        }}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => {
      const label = labels.find(({ value }) => value === row.original.label);

      return (
        <div className="flex space-x-2">
          {label ? <Badge variant="outline">{label.label}</Badge> : null}
          <span className="max-w-[500px] truncate font-medium">{row.getValue("title")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = statuses.find(({ value }) => value === row.getValue("status"));

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
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const priority = priorities.find(({ value }) => value === row.getValue("priority"));

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
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
