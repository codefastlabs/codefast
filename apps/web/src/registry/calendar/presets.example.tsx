import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import { Card, CardContent, CardFooter } from "@codefast/ui/card";
import * as React from "react";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function CalendarWithPresets() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), 1, 12));
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  return (
    <Card className="mx-auto w-fit max-w-75" size="sm">
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fixedWeeks
          className="p-0 [--cell-size:--spacing(9.5)]"
        />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t">
        {[
          { label: "Today", value: 0 },
          { label: "Tomorrow", value: 1 },
          { label: "In 3 days", value: 3 },
          { label: "In a week", value: 7 },
          { label: "In 2 weeks", value: 14 },
        ].map((preset) => (
          <Button
            key={preset.value}
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const newDate = addDays(new Date(), preset.value);
              setDate(newDate);
              setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
            }}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
