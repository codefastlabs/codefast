import { Calendar } from "@codefast/ui/calendar";
import { useState } from "react";

/** Structural match for @daypicker/react's DateRange (kept local to avoid a transitive import). */
interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

const FORMAT = { dateStyle: "medium" } as const;

export function CalendarRange() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 5, 9),
    to: new Date(2026, 5, 15),
  });

  return (
    <div className="space-y-3">
      <Calendar className="rounded-xl border" mode="range" numberOfMonths={2} selected={range} onSelect={setRange} />
      <p className="text-center text-xs text-ui-muted">
        {range?.from ? (
          <>
            <span className="font-medium text-ui-fg">{range.from.toLocaleDateString(undefined, FORMAT)}</span>
            {range.to ? (
              <>
                {" – "}
                <span className="font-medium text-ui-fg">{range.to.toLocaleDateString(undefined, FORMAT)}</span>
              </>
            ) : null}
          </>
        ) : (
          "Pick a start and end date"
        )}
      </p>
    </div>
  );
}
