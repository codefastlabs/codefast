import { Calendar } from "@codefast/ui/calendar";
import { Card, CardContent } from "@codefast/ui/card";
import * as React from "react";

const initialDate = new Date(new Date().getFullYear(), 1, 3);

export function CalendarWeekNumbers() {
  const [date, setDate] = React.useState<Date | undefined>(initialDate);

  return (
    <Card className="mx-auto w-fit p-0">
      <CardContent className="p-0">
        <Calendar mode="single" defaultMonth={date ?? initialDate} selected={date} onSelect={setDate} showWeekNumber />
      </CardContent>
    </Card>
  );
}
