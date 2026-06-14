import { Calendar } from "@codefast/ui/calendar";
import { Field, FieldLabel } from "@codefast/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@codefast/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

function formatDate(date: Date | undefined): string {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
}

function isValidDate(date: Date | undefined): boolean {
  if (!date) {
    return false;
  }

  return !Number.isNaN(date.getTime());
}

const initialDate = new Date("2025-06-01");

export function DatePickerInput() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [month, setMonth] = useState<Date>(initialDate);
  const [value, setValue] = useState(formatDate(initialDate));

  return (
    <Field className="mx-auto w-48">
      <FieldLabel htmlFor="date-input">Subscription Date</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-input"
          value={value}
          placeholder="June 01, 2025"
          onChange={(event) => {
            const next = new Date(event.target.value);
            setValue(event.target.value);
            if (isValidDate(next)) {
              setDate(next);
              setMonth(next);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton id="date-input-trigger" variant="ghost" size="icon-xs" aria-label="Select date">
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent align="end" alignOffset={-8} sideOffset={10} className="w-auto overflow-hidden p-0">
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={(next) => {
                  setDate(next);
                  setValue(formatDate(next));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
