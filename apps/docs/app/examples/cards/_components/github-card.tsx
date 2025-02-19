import type { JSX } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
} from '@codefast/ui';
import { ChevronDownIcon, CircleIcon, PlusIcon, StarIcon } from '@radix-ui/react-icons';

export function Github(): JSX.Element {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>codefast/ui</CardTitle>
          <CardDescription>
            Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open
            Source.
          </CardDescription>
        </div>

        <div className="bg-secondary text-secondary-foreground shadow-xs inline-flex items-center gap-1 rounded-md">
          <Button
            className="px-3 shadow-none"
            prefix={<StarIcon className="text-muted-foreground" />}
            variant="secondary"
          >
            Star
          </Button>
          <Separator className="bg-border h-5" orientation="vertical" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                icon
                aria-label="More options"
                className="shadow-none"
                prefix={<ChevronDownIcon className="text-secondary-foreground" />}
                variant="secondary"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent forceMount align="end" alignOffset={-5} className="w-[12.5rem]">
              <DropdownMenuLabel>Suggested Lists</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Future Ideas</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>My Stack</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Inspiration</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PlusIcon className="mr-2 size-4" /> Create List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-muted-foreground flex gap-x-4 text-sm">
          <div className="flex items-center">
            <CircleIcon className="mr-1 size-3 fill-sky-400 text-sky-400" />
            TypeScript
          </div>
          <div className="flex items-center">
            <StarIcon className="mr-1 size-3" />
            20k
          </div>
          <div>Updated April 2023</div>
        </div>
      </CardContent>
    </Card>
  );
}
