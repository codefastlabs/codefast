"use client";

import { Calendar } from "@codefast/ui";
import { addDays } from "date-fns";
import { useState } from "react";


import type { DateRange } from "@codefast/ui";
import type { JSX } from "react";

import { GridWrapper } from "@/components/grid-wrapper";

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
    <GridWrapper className="@5xl:grid-cols-2 *:grid *:place-items-center">
      <div className="">
        <Calendar className="rounded-md border shadow-sm" />
      </div>
      <div className="">
        <Calendar className="rounded-md border shadow-sm" showWeekNumber />
      </div>
      <div className="">
        <Calendar className="rounded-md border shadow-sm" mode="single" onSelect={setDate} selected={date} />
      </div>
      <div className="col-span-full">
        <Calendar
          className="rounded-md border shadow-sm"
          defaultMonth={dateRange?.from}
          disabled={(dateValue) => dateValue > new Date() || dateValue < new Date("1900-01-01")}
          mode="range"
          numberOfMonths={2}
          onSelect={setDateRange}
          selected={dateRange}
        />
      </div>
      <div className="">
        <Calendar
          captionLayout="dropdown"
          className="rounded-md border shadow-sm"
          defaultMonth={dateRange?.from}
          disabled={(dateValue) => dateValue > new Date() || dateValue < new Date("1900-01-01")}
          mode="range"
          onSelect={setDateRange2}
          selected={dateRange2}
          showWeekNumber
        />
      </div>
      <div className="col-span-full">
        <Calendar
          className="rounded-md border shadow-sm"
          defaultMonth={range?.from}
          mode="range"
          numberOfMonths={3}
          onSelect={setRange}
          selected={range}
        />
      </div>
    </GridWrapper>
  );
}
