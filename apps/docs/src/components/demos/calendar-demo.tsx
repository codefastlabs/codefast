'use client';

import type { DateRange } from '@codefast/ui';
import type { JSX } from 'react';

import { Calendar } from '@codefast/ui';
import { addDays } from 'date-fns';
import { useState } from 'react';

export function CalendarDemo(): JSX.Element {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
  });
  const [dateRange2, setDateRange2] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
  });
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 50),
  });

  return (
    <div className="@md:flex-row flex flex-col flex-wrap items-start gap-2">
      <div className="">
        <Calendar className="rounded-md border shadow-sm" mode="single" selected={date} onSelect={setDate} />
      </div>
      <div className="">
        <Calendar
          className="rounded-md border shadow-sm"
          defaultMonth={dateRange?.from}
          disabled={(dateValue) => dateValue > new Date() || dateValue < new Date('1900-01-01')}
          mode="range"
          numberOfMonths={2}
          selected={dateRange}
          onSelect={setDateRange}
        />
      </div>
      <div className="">
        <Calendar
          showWeekNumber
          captionLayout="dropdown"
          className="rounded-md border shadow-sm"
          defaultMonth={dateRange?.from}
          disabled={(dateValue) => dateValue > new Date() || dateValue < new Date('1900-01-01')}
          mode="range"
          selected={dateRange2}
          onSelect={setDateRange2}
        />
      </div>
      <div className="">
        <Calendar
          className="rounded-md border shadow-sm"
          defaultMonth={range?.from}
          mode="range"
          numberOfMonths={3}
          selected={range}
          onSelect={setRange}
        />
      </div>
    </div>
  );
}
