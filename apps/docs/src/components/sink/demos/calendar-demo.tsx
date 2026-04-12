import { cn } from "@codefast/tailwind-variants";
import { Button } from "@codefast/ui/button";
import { Calendar, CalendarDayButton } from "@codefast/ui/calendar";
import { Card, CardContent, CardFooter } from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { addDays } from "date-fns";
import { Clock2Icon } from "lucide-react";
import { useState } from "react";
import { es } from "react-day-picker/locale";
import type { CalendarDayButtonProps } from "@codefast/ui/calendar";
import type { DateRange } from "react-day-picker";

export function CalendarDemo() {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col flex-wrap justify-center gap-8",
        "p-10",
        "bg-muted",
        "lg:flex-row",
      )}
    >
      <CalendarSingle />
      <CalendarMultiple />
      <CalendarRange />
      <CalendarBookedDates />
      <CalendarRangeMultipleMonths />
      <CalendarWithTime />
      <CalendarWithPresets />
      <CalendarCustomDays />
    </div>
  );
}

function CalendarSingle() {
  const [date, setDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 12),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>Single Selection</div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-xl border shadow-sm"
        captionLayout="dropdown"
      />
    </div>
  );
}

function CalendarMultiple() {
  return (
    <div className="flex flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>Multiple Selection</div>
      <Calendar mode="multiple" className="rounded-xl border shadow-sm" />
    </div>
  );
}

function CalendarRange() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 12),
    to: addDays(new Date(new Date().getFullYear(), 0, 12), 30),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>Range Selection</div>
      <Calendar
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
        className="rounded-xl border shadow-sm"
      />
    </div>
  );
}

function CalendarRangeMultipleMonths() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 3, 12),
    to: addDays(new Date(new Date().getFullYear(), 3, 12), 60),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>Range Selection + Locale</div>
      <Calendar
        mode="range"
        defaultMonth={range?.from}
        selected={range}
        onSelect={setRange}
        numberOfMonths={3}
        locale={es}
        fixedWeeks
        className="rounded-xl border shadow-sm"
      />
    </div>
  );
}

function CalendarBookedDates() {
  const [date, setDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), 1, 3));
  const bookedDates = Array.from(
    { length: 15 },
    (_, i) => new Date(new Date().getFullYear(), new Date().getMonth(), 12 + i),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>With booked dates</div>
      <Calendar
        mode="single"
        defaultMonth={date}
        selected={date}
        onSelect={setDate}
        disabled={bookedDates}
        modifiers={{
          booked: bookedDates,
        }}
        modifiersClassNames={{
          booked: "[&>button]:line-through opacity-100",
        }}
        className="rounded-xl border shadow-sm"
      />
    </div>
  );
}

function CalendarWithTime() {
  const [date, setDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 12),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>With Time Input</div>
      <Card className={cn("w-fit", "py-4")}>
        <CardContent className="px-4">
          <Calendar mode="single" selected={date} onSelect={setDate} className="p-0" />
        </CardContent>
        <CardFooter className={cn("flex flex-col gap-3", "px-4 pt-4", "border-t")}>
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="time-from">Start Time</Label>
            <div className="relative flex w-full items-center gap-2">
              <Clock2Icon
                className={cn(
                  "absolute size-4",
                  "left-2.5",
                  "text-muted-foreground",
                  "pointer-events-none select-none",
                )}
              />
              <Input
                id="time-from"
                type="time"
                step="1"
                defaultValue="10:30:00"
                className={cn(
                  "pl-8",
                  "appearance-none",
                  "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                )}
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor="time-to">End Time</Label>
            <div className="relative flex w-full items-center gap-2">
              <Clock2Icon
                className={cn(
                  "absolute size-4",
                  "left-2.5",
                  "text-muted-foreground",
                  "pointer-events-none select-none",
                )}
              />
              <Input
                id="time-to"
                type="time"
                step="1"
                defaultValue="12:30:00"
                className={cn(
                  "pl-8",
                  "appearance-none",
                  "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                )}
              />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function CalendarCustomDays() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 11, 8),
    to: addDays(new Date(new Date().getFullYear(), 11, 8), 10),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>With Custom Days and Formatters</div>
      <Calendar
        mode="range"
        defaultMonth={range?.from}
        selected={range}
        onSelect={setRange}
        numberOfMonths={1}
        captionLayout="dropdown"
        className={cn("rounded-xl border shadow-sm", "[--cell-size:--spacing(12)]")}
        formatters={{
          formatMonthDropdown: (date) => {
            return date.toLocaleString("default", { month: "long" });
          },
        }}
        components={{
          DayButton: ({ children, modifiers, day, ...props }: CalendarDayButtonProps) => {
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

            return (
              <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                {children}
                {!modifiers.outside && <span>{isWeekend ? "$120" : "$100"}</span>}
              </CalendarDayButton>
            );
          },
        }}
      />
    </div>
  );
}

function CalendarWithPresets() {
  const [date, setDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), 1, 12));
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  return (
    <div className="flex max-w-75 flex-col gap-3">
      <div className={cn("px-2", "text-center text-sm")}>With Presets</div>
      <Card className={cn("w-fit", "py-4")}>
        <CardContent className="px-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            fixedWeeks
            className={cn("p-0", "[--cell-size:--spacing(9.5)]")}
          />
        </CardContent>
        <CardFooter className={cn("flex flex-wrap gap-2", "px-4 pt-4", "border-t")}>
          {[
            { label: "Today", value: 0 },
            { label: "Tomorrow", value: 1 },
            { label: "In 3 days", value: 3 },
            { label: "In a week", value: 7 },
            { label: "In 2 weeks", value: 14 },
          ].map((preset) => (
            <Button
              key={preset.value}
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const newDate = addDays(new Date(), preset.value);

                setDate(newDate);
                setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
              }}
            >
              {preset.label}
            </Button>
          ))}
        </CardFooter>
      </Card>
    </div>
  );
}
