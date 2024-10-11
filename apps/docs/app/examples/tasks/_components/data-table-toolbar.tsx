import { Button, DataTableViewOptions, TextInput } from '@codefast/ui';
import { Cross2Icon } from '@radix-ui/react-icons';
import { type Table } from '@tanstack/react-table';
import { type JSX } from 'react';
import { DataTableFacetedFilter } from '@/app/examples/tasks/_components/data-table-faceted-filter';
import { priorities, statuses } from '@/app/examples/tasks/_data/data';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>): JSX.Element {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between gap-x-4">
      <div className="flex max-w-screen-sm flex-1 items-center space-x-2">
        <TextInput
          className="h-8 lg:w-64"
          placeholder="Filter tasks..."
          value={String(table.getColumn('title')?.getFilterValue() ?? '')}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
        />
        {table.getColumn('status') && (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            options={statuses}
            title="Status"
          />
        )}
        {table.getColumn('priority') && (
          <DataTableFacetedFilter
            column={table.getColumn('priority')}
            options={priorities}
            title="Priority"
          />
        )}
        {isFiltered ? (
          <Button
            size="xs"
            suffix={<Cross2Icon />}
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
            }}
          >
            Reset
          </Button>
        ) : null}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
