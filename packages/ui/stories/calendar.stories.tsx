import type { JSX } from "react";
import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";

import { Calendar } from "#/components/calendar";

import preview from "../.storybook/preview";

/**
 * Calendar manages a selected date with `useState`, so each story is demoed via
 * `render` with a small wrapper.
 */
interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

const FIXED_MONTH = new Date(2025, 0, 1);

function SingleCalendar(): JSX.Element {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <Calendar
      className="rounded-xl border"
      mode="single"
      defaultMonth={FIXED_MONTH}
      selected={date}
      onSelect={setDate}
    />
  );
}

function MultipleCalendar(): JSX.Element {
  const [dates, setDates] = useState<Array<Date> | undefined>([]);

  return <Calendar className="rounded-xl border" mode="multiple" selected={dates} onSelect={setDates} />;
}

function RangeCalendar(): JSX.Element {
  const initialFrom = new Date(new Date().getFullYear(), 0, 12);
  const [range, setRange] = useState<DateRange | undefined>({
    from: initialFrom,
    to: addDays(initialFrom, 30),
  });

  return (
    <Calendar
      className="rounded-xl border"
      mode="range"
      defaultMonth={range?.from ?? initialFrom}
      selected={range}
      onSelect={setRange}
      numberOfMonths={2}
    />
  );
}

const meta = preview.meta({
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component: [
          "A date-picker grid built on React DayPicker, supporting single, multiple, and range selection.",
          "",
          "Controlled via `mode` plus `selected`/`onSelect`; stories wrap it in `useState` to demo selection.",
        ].join("\n"),
      },
    },
  },
  title: "Form/Calendar",
});

export const Default = meta.story({
  render: () => <SingleCalendar />,
});

export const Multiple = meta.story({
  render: () => <MultipleCalendar />,
});

export const Range = meta.story({
  render: () => <RangeCalendar />,
});

export const SelectsADay = meta.story({
  render: () => <SingleCalendar />,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsADay.test("selects a day", async ({ canvas, userEvent }) => {
  // Days render as gridcells whose accessible name is the day number; the clickable
  // element is the <button> inside, which gets data-selected-single when selected.
  const cell = canvas.getAllByRole("gridcell").find((gridcell) => gridcell.textContent?.trim() === "15");

  await expect(cell).toBeDefined();

  const dayButton = within(cell as HTMLElement).getByRole("button");

  await userEvent.click(dayButton);

  // react-day-picker swaps the inner <button> on selection, so assert on the
  // stable <td> gridcell, which gains aria-selected / data-selected when picked.
  await waitFor(async () => {
    await expect(cell as HTMLElement).toHaveAttribute("aria-selected", "true");
  });
  await expect(cell as HTMLElement).toHaveAttribute("data-selected", "true");
});
