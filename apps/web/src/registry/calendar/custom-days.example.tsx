import { Calendar, CalendarDayButton } from "@codefast/ui/calendar";
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

const initialFrom = new Date(new Date().getFullYear(), 11, 8);

export function CalendarCustomDays() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: initialFrom,
    to: addDays(initialFrom, 10),
  });

  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <Calendar
          mode="range"
          defaultMonth={range?.from ?? initialFrom}
          selected={range}
          onSelect={setRange}
          numberOfMonths={1}
          captionLayout="dropdown"
          className="[--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
          formatters={{
            formatMonthDropdown: (date) => {
              return date.toLocaleString("default", { month: "long" });
            },
          }}
          components={{
            DayButton: ({ children, modifiers, day, ...props }) => {
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

              return (
                <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                  {children}
                  {!modifiers.outside && <span>{isWeekend ? "$120" : "$100"}</span>}
                </CalendarDayButton>
              );
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
