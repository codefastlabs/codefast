import { Calendar } from "@codefast/ui/calendar";
import { useState } from "react";

export function CalendarDisabled() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 11));

  return (
    <div className="space-y-3">
      <Calendar
        className="rounded-xl border"
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={{ dayOfWeek: [0, 6] }}
      />
      <p className="text-center text-xs text-ui-muted">Weekends are disabled.</p>
    </div>
  );
}
