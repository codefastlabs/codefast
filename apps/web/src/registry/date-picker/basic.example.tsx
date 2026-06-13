import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import { Field, FieldLabel } from "@codefast/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { useState } from "react";

function formatLong(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export function DatePickerBasic() {
  const [date, setDate] = useState<Date>();

  return (
    <Field className="mx-auto w-44">
      <FieldLabel htmlFor="date-picker-basic">Date</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date-picker-basic" className="justify-start font-normal">
            {date ? formatLong(date) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={setDate} {...(date ? { defaultMonth: date } : {})} />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
