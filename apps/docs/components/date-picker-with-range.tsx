'use client';

import { Calendar, type DateRange } from '@codefast/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@codefast/ui/popover';
import { addDays, format } from 'date-fns';
import { type HTMLAttributes, type JSX, useState } from 'react';
import { cn } from '@codefast/ui/utils';
import { Button } from '@codefast/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';

export function DatePickerWithRange({
  className,
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 20),
    to: addDays(new Date(2024, 0, 20), 20),
  });

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            <ButtonValue date={date} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ButtonValueProps {
  date: DateRange | undefined;
}

function ButtonValue({ date }: ButtonValueProps): JSX.Element {
  if (date?.from && date.to) {
    return (
      <>
        {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
      </>
    );
  } else if (date?.from) {
    return <>{format(date.from, 'LLL dd, y')}</>;
  }

  return <span>Pick a date</span>;
}
