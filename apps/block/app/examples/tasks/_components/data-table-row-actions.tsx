import type { Row } from '@tanstack/react-table';
import type { JSX } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@codefast/ui';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

import { labels } from '@/app/examples/tasks/_data/data';
import { taskSchema } from '@/app/examples/tasks/_data/schema';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>): JSX.Element {
  const task = taskSchema.parse(row.original);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          icon
          aria-label="Open menu"
          className="data-[state=open]:bg-accent"
          prefix={<DotsHorizontalIcon />}
          size="xs"
          variant="ghost"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[10rem]">
        <DropdownMenuItem>Edit</DropdownMenuItem>

        <DropdownMenuItem>Make a copy</DropdownMenuItem>

        <DropdownMenuItem>Favorite</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>

          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
