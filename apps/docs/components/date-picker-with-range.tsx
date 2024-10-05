'use client';

import {
  Button,
  Calendar,
  cn,
  type DateRange,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codefast/ui';
import { addDays, format } from 'date-fns';
import { type HTMLAttributes, type JSX, useState } from 'react';
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
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
            id="date"
            prefix={<CalendarIcon />}
            variant="outline"
          >
            <ButtonValue date={date} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            defaultMonth={date?.from}
            mode="range"
            numberOfMonths={2}
            selected={date}
            onSelect={setDate}
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
