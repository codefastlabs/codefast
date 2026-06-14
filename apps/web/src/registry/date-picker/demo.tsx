import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

function formatLong(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export function DatePickerDemo() {
  const [date, setDate] = useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="w-53 justify-between text-start font-normal data-[empty=true]:text-muted-foreground"
        >
          {date ? formatLong(date) : <span>Pick a date</span>}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} {...(date ? { defaultMonth: date } : {})} />
      </PopoverContent>
    </Popover>
  );
}
