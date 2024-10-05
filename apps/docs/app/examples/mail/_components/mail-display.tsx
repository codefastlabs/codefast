import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Calendar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@codefast/ui';
import { addDays, addHours, format, nextSaturday } from 'date-fns';
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from 'lucide-react';
import { type JSX } from 'react';
import { type EmailMessage } from '@/app/examples/mail/_data/data';

interface MailDisplayProps {
  mail: EmailMessage | null | undefined;
}

export function MailDisplay({ mail }: MailDisplayProps): JSX.Element {
  const today = new Date();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon
                aria-label="Archive"
                disabled={!mail}
                prefix={<Archive className="size-4" />}
                variant="ghost"
              />
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon
                aria-label="Move to junk"
                disabled={!mail}
                prefix={<ArchiveX />}
                variant="ghost"
              />
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon
                aria-label="Move to trash"
                disabled={!mail}
                prefix={<Trash2 />}
                variant="ghost"
              />
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator className="mx-1 h-6" orientation="vertical" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    icon
                    aria-label="Snooze"
                    disabled={!mail}
                    prefix={<Clock />}
                    variant="ghost"
                  />
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-64 gap-1">
                    <Button
                      className="justify-start font-normal"
                      variant="ghost"
                    >
                      Later today{' '}
                      <span className="text-muted-foreground ml-auto">
                        {format(addHours(today, 4), 'E, h:m b')}
                      </span>
                    </Button>
                    <Button
                      className="justify-start font-normal"
                      variant="ghost"
                    >
                      Tomorrow
                      <span className="text-muted-foreground ml-auto">
                        {format(addDays(today, 1), 'E, h:m b')}
                      </span>
                    </Button>
                    <Button
                      className="justify-start font-normal"
                      variant="ghost"
                    >
                      This weekend
                      <span className="text-muted-foreground ml-auto">
                        {format(nextSaturday(today), 'E, h:m b')}
                      </span>
                    </Button>
                    <Button
                      className="justify-start font-normal"
                      variant="ghost"
                    >
                      Next week
                      <span className="text-muted-foreground ml-auto">
                        {format(addDays(today, 7), 'E, h:m b')}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar mode="single" />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon
                aria-label="Reply"
                disabled={!mail}
                prefix={<Reply />}
                variant="ghost"
              />
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon
                aria-label="Reply all"
                disabled={!mail}
                prefix={<ReplyAll className="size-4" />}
                variant="ghost"
              />
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon
                aria-label="Forward"
                disabled={!mail}
                prefix={<Forward />}
                variant="ghost"
              />
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator className="mx-2 h-6" orientation="vertical" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              icon
              aria-label="More options"
              disabled={!mail}
              suffix={<MoreVertical />}
              variant="ghost"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      {mail ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={mail.name} />
                <AvatarFallback>
                  {mail.name
                    .split(' ')
                    .map((chunk) => chunk[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{mail.name}</div>
                <div className="line-clamp-1 text-xs">{mail.subject}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Reply-To:</span> {mail.email}
                </div>
              </div>
            </div>
            {mail.date ? (
              <div className="text-muted-foreground ml-auto text-xs">
                {format(new Date(mail.date), 'PPpp')}
              </div>
            ) : null}
          </div>
          <Separator />
          <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
            {mail.text}
          </div>
          <Separator className="mt-auto" />
          <div className="p-4">
            <form>
              <div className="grid gap-4">
                <Textarea
                  className="p-4"
                  placeholder={`Reply ${mail.name}...`}
                />
                <div className="flex items-center">
                  <Label
                    className="flex items-center gap-2 text-xs font-normal"
                    htmlFor="mute"
                  >
                    <Switch aria-label="Mute thread" id="mute" /> Mute this
                    thread
                  </Label>
                  <Button
                    className="ml-auto"
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground p-8 text-center">
          No message selected
        </div>
      )}
    </div>
  );
}
