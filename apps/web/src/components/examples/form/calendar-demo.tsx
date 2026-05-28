import { useState } from "react";

import { Calendar } from "@codefast/ui/calendar";

export function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Calendar className="rounded-xl border" mode="single" selected={date} onSelect={setDate} />
  );
}
