import { Calendar } from "@codefast/ui/calendar";
import { Card, CardContent } from "@codefast/ui/card";
import * as React from "react";

/** Structural match for @daypicker/react's DateRange (kept local to avoid a transitive import). */
interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const initialFrom = new Date(new Date().getFullYear(), 0, 12);

export function CalendarRange() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: initialFrom,
    to: addDays(initialFrom, 30),
  });

  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from ?? initialFrom}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
        />
      </CardContent>
    </Card>
  );
}
