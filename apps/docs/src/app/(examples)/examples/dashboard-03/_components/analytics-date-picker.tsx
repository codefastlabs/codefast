"use client";

import type { JSX } from "react";
import type { DateRange } from "react-day-picker";

import { addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useId, useState } from "react";

import {
  Button,
  Calendar,
  CalendarRangeLabel,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@codefast/ui";

export function AnalyticsDatePicker(): JSX.Element {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });
  const id = useId();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn("w-fit justify-start px-2 font-normal", !date && "text-muted-foreground")}
          id={`${id}-date`}
          variant="outline"
        >
          <CalendarIcon className="text-muted-foreground" />
          <CalendarRangeLabel date={date} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          defaultMonth={date?.from}
          mode="range"
          numberOfMonths={2}
          selected={date}
          onSelect={setDate}
        />
      </PopoverContent>
    </Popover>
  );
}
