import type { ComponentDoc } from "#/components/examples/docs/types";
import { calendarRangeCode, calendarSingleCode } from "#/components/examples/codes";
import { CalendarRange } from "#/components/examples/docs/calendar/range";
import { CalendarSingle } from "#/components/examples/docs/calendar/single";

export const calendarDoc: ComponentDoc = {
  examples: [
    {
      id: "single",
      title: "Single date",
      description: "Controlled selection with a live, formatted readout.",
      Demo: CalendarSingle,
      code: calendarSingleCode,
    },
    {
      id: "range",
      title: "Date range",
      description: 'mode="range" over two months, with the picked span shown below.',
      Demo: CalendarRange,
      code: calendarRangeCode,
    },
  ],
  anatomy: `import { Calendar } from "@codefast/ui/calendar";

<Calendar
  mode="single"          // "single" | "range" | "multiple"
  selected={date}
  onSelect={setDate}
/>`,
  api: [
    {
      name: "Calendar",
      description: "Wraps react-day-picker; every DayPicker prop is forwarded.",
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
      "Built on react-day-picker, which implements the WAI-ARIA grid pattern.",
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
