import { Calendar } from "@codefast/ui/calendar";
import { Field, FieldLabel } from "@codefast/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@codefast/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { parseDate } from "chrono-node";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

function formatDate(date: Date | undefined): string {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
}

export function DatePickerNaturalLanguage() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("In 2 days");
  const [date, setDate] = useState<Date | undefined>(parseDate(value) ?? undefined);

  return (
    <Field className="mx-auto max-w-xs">
      <FieldLabel htmlFor="date-natural">Schedule Date</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-natural"
          value={value}
          placeholder="Tomorrow or next week"
          onChange={(event) => {
            setValue(event.target.value);
            const next = parseDate(event.target.value);
            if (next) {
              setDate(next);
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
              <InputGroupButton id="date-natural-trigger" variant="ghost" size="icon-xs" aria-label="Select date">
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-auto overflow-hidden p-0">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                {...(date ? { defaultMonth: date } : {})}
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
      <div className="px-1 text-sm text-muted-foreground">
        Your post will be published on <span className="font-medium">{formatDate(date)}</span>.
      </div>
    </Field>
  );
}
