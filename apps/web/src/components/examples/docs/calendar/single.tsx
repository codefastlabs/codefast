import { useState } from "react";
import { Calendar } from "@codefast/ui/calendar";

export function CalendarSingle() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 12));

  return (
    <div className="space-y-3">
      <Calendar className="rounded-xl border" mode="single" selected={date} onSelect={setDate} />
      <p className="text-center text-xs text-ui-muted">
        Selected:{" "}
        <span className="font-medium text-ui-fg">
          {date ? date.toLocaleDateString(undefined, { dateStyle: "medium" }) : "none"}
        </span>
      </p>
    </div>
  );
}
