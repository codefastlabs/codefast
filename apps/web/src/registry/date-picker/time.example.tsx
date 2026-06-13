import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@codefast/ui/field";
import { Input } from "@codefast/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

function formatLong(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export function DatePickerTime() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <FieldGroup className="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-time">Date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" id="date-picker-time" className="w-32 justify-between font-normal">
              {date ? formatLong(date) : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto overflow-hidden p-0">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              {...(date ? { defaultMonth: date } : {})}
              onSelect={(value) => {
                setDate(value);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="time-picker">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker"
          step="1"
          defaultValue="10:30:00"
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  );
}
