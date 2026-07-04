import { DatePickerBasic } from "#/registry/date-picker/basic.example";
import { DatePickerDemo } from "#/registry/date-picker/demo";
import { DatePickerDob } from "#/registry/date-picker/dob.example";
import { DatePickerInput } from "#/registry/date-picker/input.example";
import { DatePickerNaturalLanguage } from "#/registry/date-picker/natural-language.example";
import { DatePickerRange } from "#/registry/date-picker/range.example";
import { DatePickerRtl } from "#/registry/date-picker/rtl.example";
import { DatePickerTime } from "#/registry/date-picker/time.example";
import { docDemo, docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const datePickerDoc: ComponentDoc = {
  examples: [
    {
      id: "date-picker-demo",
      title: "Demo",
      description: "A button that opens a calendar in a popover and shows the picked date.",
      Demo: DatePickerDemo,
      source: docDemo("date-picker"),
    },
    {
      id: "date-picker-basic",
      title: "Basic",
      description: "A labelled date field that opens a single-date calendar.",
      Demo: DatePickerBasic,
      source: docSource("date-picker", "basic"),
    },
    {
      id: "date-picker-range",
      title: "Range Picker",
      description: "Select a start and end date across two months with mode=range.",
      Demo: DatePickerRange,
      source: docSource("date-picker", "range"),
    },
    {
      id: "date-picker-dob",
      title: "Date of Birth",
      description: "A dropdown caption lets users jump to a distant month or year quickly.",
      Demo: DatePickerDob,
      source: docSource("date-picker", "dob"),
    },
    {
      id: "date-picker-input",
      title: "Input",
      description: "Type a date in the field or pick it from the calendar — the two stay in sync.",
      Demo: DatePickerInput,
      source: docSource("date-picker", "input"),
    },
    {
      id: "date-picker-time",
      title: "Time Picker",
      description: "Pair a date picker with a native time input.",
      Demo: DatePickerTime,
      source: docSource("date-picker", "time"),
    },
    {
      id: "date-picker-natural-language",
      title: "Natural Language",
      description: "Parse phrases like “in 2 days” into a date with chrono-node.",
      Demo: DatePickerNaturalLanguage,
      source: docSource("date-picker", "natural-language"),
    },
    {
      id: "date-picker-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: DatePickerRtl,
      source: docSource("date-picker", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [
    {
      name: "Popover",
      children: [
        { name: "PopoverTrigger", children: [{ name: "Button" }] },
        { name: "PopoverContent", children: [{ name: "Calendar" }] },
      ],
    },
  ],
  guidelines: {
    do: [
      "Compose the picker from Popover + Calendar so it inherits their focus and keyboard behaviour.",
      "Mirror the calendar selection back into any text input so both stay in sync.",
    ],
    dont: ["Don’t block typing — let users enter a date directly as well as pick one."],
  },
  related: ["calendar", "popover", "input-group"],
};
