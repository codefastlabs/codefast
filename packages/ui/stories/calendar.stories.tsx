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

/**
 * Calendar's props are a union over `mode`, so binding `component` would make
 * args resolve to `never`. We expose a flat custom args shape for the mode-agnostic
 * props and keep `mode="single"` fixed in the wrapper.
 */
interface CalendarArgs {
  disabled: boolean;
  numberOfMonths: number;
  showOutsideDays: boolean;
}

function SingleCalendar({ disabled, numberOfMonths, showOutsideDays }: CalendarArgs): JSX.Element {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <Calendar
      className="rounded-xl border"
      defaultMonth={FIXED_MONTH}
      disabled={disabled}
      mode="single"
      numberOfMonths={numberOfMonths}
      onSelect={setDate}
      selected={date}
      showOutsideDays={showOutsideDays}
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

const meta = preview.type<{ args: CalendarArgs }>().meta({
  args: { disabled: false, numberOfMonths: 1, showOutsideDays: true },
  argTypes: {
    disabled: { control: "boolean" },
    numberOfMonths: { control: "number" },
    showOutsideDays: { control: "boolean" },
  },
  subcomponents: { Calendar },
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
  render: (args) => <SingleCalendar {...args} />,
});

export const Multiple = meta.story({
  render: () => <MultipleCalendar />,
});

export const Range = meta.story({
  render: () => <RangeCalendar />,
});

export const SelectsADay = meta.story({
  render: Default.input.render,
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
