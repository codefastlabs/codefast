import { Button } from '@codefast/ui/button';
import { DataTableViewOptions } from '@codefast/ui/data-table';
import { Cross2Icon } from '@radix-ui/react-icons';
import { type Table } from '@tanstack/react-table';
import { type JSX } from 'react';
import { TextInput } from '@codefast/ui/text-input';
import { priorities, statuses } from '@/app/examples/tasks/_data/data';
import { DataTableFacetedFilter } from '@/app/examples/tasks/_components/data-table-faceted-filter';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>): JSX.Element {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <TextInput
          className="h-8 w-[150px] lg:w-64"
          placeholder="Filter tasks..."
          value={String(table.getColumn('title')?.getFilterValue() ?? '')}
          onChange={(event) => table.getColumn('title')?.setFilterValue(event.target.value)}
        />
        {table.getColumn('status') && (
          <DataTableFacetedFilter column={table.getColumn('status')} options={statuses} title="Status" />
        )}
        {table.getColumn('priority') && (
          <DataTableFacetedFilter column={table.getColumn('priority')} options={priorities} title="Priority" />
        )}
        {isFiltered ? (
          <Button
            className="h-8 px-2 lg:px-3"
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
            }}
          >
            Reset
            <Cross2Icon className="ml-2 size-4" />
          </Button>
        ) : null}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
