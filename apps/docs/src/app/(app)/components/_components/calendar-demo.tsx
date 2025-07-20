"use client";

import type { JSX } from "react";
import type { DateRange } from "react-day-picker";

import { addDays } from "date-fns";
import { useState } from "react";

import { GridWrapper } from "@/components/grid-wrapper";
import { Calendar } from "@codefast/ui";

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
        <Calendar showWeekNumber className="rounded-md border shadow-sm" />
      </div>
      <div className="">
        <Calendar
          className="rounded-md border shadow-sm"
          mode="single"
          selected={date}
          onSelect={setDate}
        />
      </div>
      <div className="col-span-full">
        <Calendar
          className="rounded-md border shadow-sm"
          defaultMonth={dateRange?.from}
          disabled={(dateValue) => dateValue > new Date() || dateValue < new Date("1900-01-01")}
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
          disabled={(dateValue) => dateValue > new Date() || dateValue < new Date("1900-01-01")}
          mode="range"
          selected={dateRange2}
          onSelect={setDateRange2}
        />
      </div>
      <div className="col-span-full">
        <Calendar
          className="rounded-md border shadow-sm"
          defaultMonth={range?.from}
          mode="range"
          numberOfMonths={3}
          selected={range}
          onSelect={setRange}
        />
      </div>
    </GridWrapper>
  );
}
