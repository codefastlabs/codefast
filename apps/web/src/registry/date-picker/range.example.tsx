import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import { Field, FieldLabel } from "@codefast/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

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

function formatShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

const initialFrom = new Date(new Date().getFullYear(), 0, 20);

export function DatePickerRange() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: initialFrom,
    to: addDays(initialFrom, 20),
  });

  return (
    <Field className="mx-auto w-60">
      <FieldLabel htmlFor="date-picker-range">Date Picker Range</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal">
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {formatShort(date.from)} - {formatShort(date.to)}
                </>
              ) : (
                formatShort(date.from)
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            defaultMonth={date?.from ?? initialFrom}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
