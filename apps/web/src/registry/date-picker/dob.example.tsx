import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import { Field, FieldLabel } from "@codefast/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { useState } from "react";

export function DatePickerDob() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <Field className="mx-auto w-44">
      <FieldLabel htmlFor="date-of-birth">Date of birth</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date-of-birth" className="justify-start font-normal">
            {date ? date.toLocaleDateString() : "Select date"}
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
  );
}
