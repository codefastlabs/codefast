import { CalendarBasic } from "#/registry/calendar/basic.example";
import { CalendarBookedDates } from "#/registry/calendar/booked-dates.example";
import { CalendarCaption } from "#/registry/calendar/caption.example";
import { CalendarCustomDays } from "#/registry/calendar/custom-days.example";
import { CalendarHijri } from "#/registry/calendar/hijri.example";
import { CalendarMultiple } from "#/registry/calendar/multiple.example";
import { CalendarWithPresets } from "#/registry/calendar/presets.example";
import { CalendarRange } from "#/registry/calendar/range.example";
import { CalendarRtl } from "#/registry/calendar/rtl.example";
import { CalendarWithTime } from "#/registry/calendar/time.example";
import { CalendarWeekNumbers } from "#/registry/calendar/week-numbers.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const calendarDoc: ComponentDoc = {
  examples: [
    {
      id: "calendar-range",
      title: "Date range",
      description: 'mode="range" over two months, with the picked span shown below.',
      Demo: CalendarRange,
      source: docSource("calendar", "range"),
      previewClassName: "block",
    },
    {
      id: "calendar-basic",
      title: "Basic",
      description: "A basic calendar component. We used className='rounded-lg border' to style the calendar.",
      Demo: CalendarBasic,
      source: docSource("calendar", "basic"),
    },
    {
      id: "calendar-booked-dates",
      title: "Booked dates",
      description: "A calendar component that allows users to select a date or a range of dates.",
      Demo: CalendarBookedDates,
      source: docSource("calendar", "booked-dates"),
    },
    {
      id: "calendar-caption",
      title: "Month and Year Selector",
      description: "Use captionLayout='dropdown' to show month and year dropdowns.",
      Demo: CalendarCaption,
      source: docSource("calendar", "caption"),
    },
    {
      id: "calendar-custom-days",
      title: "Custom Cell Size",
      description: "A calendar component that allows users to select a date or a range of dates.",
      Demo: CalendarCustomDays,
      source: docSource("calendar", "custom-days"),
    },
    {
      id: "calendar-multiple",
      title: "Multiple",
      description: "Use mode=multiple to allow selecting multiple dates.",
      Demo: CalendarMultiple,
      source: docSource("calendar", "multiple"),
    },
    {
      id: "calendar-presets",
      title: "Presets",
      description: "A calendar component that allows users to select a date or a range of dates.",
      Demo: CalendarWithPresets,
      source: docSource("calendar", "presets"),
    },
    {
      id: "calendar-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: CalendarRtl,
      source: docSource("calendar", "rtl"),
      direction: "rtl",
    },
    {
      id: "calendar-time",
      title: "Date and Time Picker",
      description: "A calendar component that allows users to select a date or a range of dates.",
      Demo: CalendarWithTime,
      source: docSource("calendar", "time"),
    },
    {
      id: "calendar-week-numbers",
      title: "Week Numbers",
      description: "Use showWeekNumber to show week numbers.",
      Demo: CalendarWeekNumbers,
      source: docSource("calendar", "week-numbers"),
    },
    {
      id: "calendar-hijri",
      title: "Persian / Hijri / Jalali Calendar",
      description: "A Persian (Jalali) calendar built with a date-fns-jalali DateLib and Eastern Arabic numerals.",
      Demo: CalendarHijri,
      source: docSource("calendar", "hijri"),
    },
  ],
  anatomy: docAnatomy("calendar"),
  api: [
    {
      name: "Calendar",
      description: "Wraps @daypicker/react; every DayPicker prop is forwarded.",
      props: [
        {
          name: "mode",
          type: '"single" | "range" | "multiple"',
          default: '"single"',
          description: "How many dates can be selected. Changes the selected/onSelect shape.",
        },
        {
          name: "selected",
          type: "Date | DateRange | Date[]",
          description: "Controlled selection — type depends on mode.",
        },
        {
          name: "onSelect",
          type: "(value) => void",
          description: "Fires with the new selection.",
        },
        {
          name: "numberOfMonths",
          type: "number",
          default: "1",
          description: "How many months to render side by side.",
        },
        {
          name: "disabled",
          type: "Matcher | Matcher[]",
          description: "Disable days (e.g. past dates, weekends).",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Arrow", "Right"], description: "Moves to the next day." },
      { keys: ["Arrow", "Left"], description: "Moves to the previous day." },
      { keys: ["Arrow", "Down"], description: "Moves to the same weekday next week." },
      { keys: ["Enter"], description: "Selects the focused day." },
      { keys: ["Page Up"], description: "Jumps to the previous month." },
    ],
    notes: [
      "Built on @daypicker/react, which implements the WAI-ARIA grid pattern.",
      "Pair with a readout or input so the selection isn’t conveyed only by colour.",
      "For a popover date field, mount Calendar inside a Popover with a trigger button.",
    ],
  },
  guidelines: {
    do: [
      "Show the selected date(s) in text near the calendar.",
      "Disable invalid ranges (e.g. past dates for a booking).",
    ],
    dont: [
      "Don’t use a calendar for far-future or distant-past dates — an input is faster.",
      "Don’t hide which dates are selectable.",
    ],
  },
  related: ["popover", "input", "field"],
};
