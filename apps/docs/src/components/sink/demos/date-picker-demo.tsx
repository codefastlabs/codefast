import { cn } from "@codefast/tailwind-variants";
import { Button } from "@codefast/ui/button";
import { Calendar } from "@codefast/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@codefast/ui/drawer";
import { useIsMobile } from "@codefast/ui/hooks/use-is-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export function DatePickerDemo() {
  return (
    <div className={cn("flex flex-col flex-wrap items-start gap-4", "md:flex-row")}>
      <DatePickerSimple />
      <DataPickerWithDropdowns />
      <DatePickerWithRange />
    </div>
  );
}

function DatePickerSimple() {
  const [date, setDate] = useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-50 justify-start",
            "px-2",
            "font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="text-muted-foreground" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto", "p-0")} align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  );
}

function DatePickerWithRange() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            "w-fit justify-start",
            "px-2",
            "font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="text-muted-foreground" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto", "p-0")} align="start">
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}

function DataPickerWithDropdowns() {
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile(450);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-50 justify-start",
              "px-2",
              "font-normal",
              !date && "text-muted-foreground",
            )}
          >
            {date ? format(date, "PPP") : <span>Pick a date</span>}
            <CalendarIcon className={cn("ml-auto", "text-muted-foreground")} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Select a date</DrawerTitle>
            <DrawerDescription>Pick a date for your appointment.</DrawerDescription>
          </DrawerHeader>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(day) => {
              setDate(day);
              setOpen(false);
            }}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-50 justify-start",
            "px-2",
            "font-normal",
            !date && "text-muted-foreground",
          )}
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <CalendarIcon className={cn("ml-auto", "text-muted-foreground")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto", "p-0")} align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} captionLayout="dropdown" />
        <div className={cn("flex gap-2", "p-2", "border-t")}>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
