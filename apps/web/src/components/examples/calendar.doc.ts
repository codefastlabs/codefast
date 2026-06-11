import { CalendarDisabled } from "#/components/examples/calendar.disabled";
import { CalendarRange } from "#/components/examples/calendar.range";
import { CalendarSingle } from "#/components/examples/calendar.single";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const calendarDoc: ComponentDoc = {
  examples: [
    {
      id: "single",
      title: "Single date",
      description: "Controlled selection with a live, formatted readout.",
      Demo: CalendarSingle,
      source: docSource("calendar", "single"),
    },
    {
      id: "range",
      title: "Date range",
      description: 'mode="range" over two months, with the picked span shown below.',
      Demo: CalendarRange,
      source: docSource("calendar", "range"),
    },
    {
      id: "disabled",
      title: "Disabled dates",
      description: "Block days with a matcher — here, weekends.",
      Demo: CalendarDisabled,
      source: docSource("calendar", "disabled"),
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
