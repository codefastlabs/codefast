import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Calendar } from "#/components/calendar";

/**
 * Calendar manages a selected date with `useState`, so it's demoed via `render`
 * with a small wrapper — keep `component` only for prop-driven single components.
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

const meta = {
  title: "Form/Calendar",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <SingleCalendar />,
};

export const Multiple: Story = {
  render: () => <MultipleCalendar />,
};

export const Range: Story = {
  render: () => <RangeCalendar />,
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const SelectsADay: Story = {
  render: () => <SingleCalendar />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
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
  },
};
