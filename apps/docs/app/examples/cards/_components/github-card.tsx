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
import {
  ChevronDownIcon,
  CircleIcon,
  PlusIcon,
  StarIcon,
} from '@radix-ui/react-icons';
import { type JSX } from 'react';

export function Github(): JSX.Element {
  return (
    <Card>
      <CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>codefast/ui</CardTitle>
          <CardDescription>
            Beautifully designed components that you can copy and paste into
            your apps. Accessible. Customizable. Open Source.
          </CardDescription>
        </div>
        <div className="bg-secondary text-secondary-foreground flex items-center rounded-md shadow-sm">
          <Button
            className="px-3 shadow-none"
            prefix={<StarIcon className="text-muted-foreground" />}
            variant="secondary"
          >
            Star
          </Button>
          <Separator className="h-[20px]" orientation="vertical" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                icon
                aria-label="More options"
                className="shadow-none"
                prefix={
                  <ChevronDownIcon className="text-secondary-foreground" />
                }
                variant="secondary"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              forceMount
              align="end"
              alignOffset={-5}
              className="w-[200px]"
            >
              <DropdownMenuLabel>Suggested Lists</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Future Ideas
              </DropdownMenuCheckboxItem>
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
        <div className="text-muted-foreground flex space-x-4 text-sm">
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
