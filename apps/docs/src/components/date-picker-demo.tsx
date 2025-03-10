'use client';

import type { DateRange } from '@codefast/ui';
import type { JSX } from 'react';

import { useIsMobile } from '@codefast/hooks';
import {
  Button,
  Calendar,
  CalendarLabel,
  CalendarRangeLabel,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codefast/ui';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

export function DatePickerDemo(): JSX.Element {
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row">
      <DatePickerSimple />

      <DatePickerWithRange />
    </div>
  );
}

function DatePickerSimple(): JSX.Element {
  const [date, setDate] = useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn('min-w-[200px] justify-start px-3 font-normal', !date && 'text-muted-foreground')}
          variant="outline"
        >
          <CalendarIcon className="text-muted-foreground" />

          <CalendarLabel date={date} />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  );
}

function DatePickerWithRange(): JSX.Element {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });
  const isMobile = useIsMobile();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn('w-fit justify-start px-3 font-normal', !date && 'text-muted-foreground')}
          id="date"
          variant="outline"
        >
          <CalendarIcon className="text-muted-foreground" />

          <CalendarRangeLabel date={date} />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          defaultMonth={date?.from}
          mode="range"
          numberOfMonths={isMobile ? 1 : 2}
          selected={date}
          onSelect={setDate}
        />
      </PopoverContent>
    </Popover>
  );
}
