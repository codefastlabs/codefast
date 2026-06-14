import { Calendar } from "@codefast/ui/calendar";
import { DateLib } from "@daypicker/react";
import * as dateFnsJalali from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { useState } from "react";

/**
 * react-day-picker v10 (@daypicker/react) dropped the dedicated
 * `react-day-picker/persian` entry point. The Persian (Jalali) calendar is now
 * assembled by hand: a `DateLib` built from `date-fns-jalali` plus the
 * `dateLib` / `numerals` / `dir` / `locale` props forwarded to the calendar.
 */
const persianDateLib = new DateLib({ locale: faIR }, dateFnsJalali);

const initialDate = new Date(2025, 5, 12);

export function CalendarHijri() {
  const [date, setDate] = useState<Date | undefined>(initialDate);

  return (
    <Calendar
      mode="single"
      defaultMonth={date ?? initialDate}
      selected={date}
      onSelect={setDate}
      dateLib={persianDateLib}
      locale={faIR}
      numerals="arabext"
      dir="rtl"
      className="rounded-lg border"
    />
  );
}
