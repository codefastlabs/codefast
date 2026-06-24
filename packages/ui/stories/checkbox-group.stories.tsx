import { useState } from "react";
import { expect } from "storybook/test";

import { CheckboxGroup, CheckboxGroupItem } from "#/components/checkbox-group";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const PERMISSIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
  { value: "admin", label: "Admin", disabled: true },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const NOTIFICATIONS = [
  {
    value: "comments",
    label: "Comments",
    hint: "When someone replies to your thread.",
  },
  {
    value: "mentions",
    label: "Mentions",
    hint: "When you're @-mentioned anywhere.",
  },
  {
    value: "digest",
    label: "Weekly digest",
    hint: "A Monday summary of activity.",
  },
];

const meta = preview.meta({
  args: { defaultValue: [], disabled: false, loop: true, orientation: "vertical" },
  argTypes: {
    onValueChange: { table: { disable: true } },
    value: { table: { disable: true } },
  },
  component: CheckboxGroup,
  subcomponents: { CheckboxGroupItem },
  parameters: {
    docs: {
      description: {
        component: [
          "A group of checkboxes that share a single array value, allowing multiple selections.",
          "",
          "**Anatomy:** `CheckboxGroup > CheckboxGroupItem`.",
          "Drive it with `value`/`defaultValue` (an array) + `onValueChange`; pair each item with a `Label`.",
        ].join("\n"),
      },
    },
  },
  title: "Form/CheckboxGroup",
});

export const Default = meta.story({
  render: (args) => (
    <CheckboxGroup {...args} className="gap-3">
      {PERMISSIONS.map(({ value, label, disabled }) => (
        <div key={value} className="flex items-center gap-2">
          <CheckboxGroupItem {...(disabled ? { disabled } : {})} id={`perm-${value}`} value={value} />
          <Label className={disabled ? "opacity-50" : ""} htmlFor={`perm-${value}`}>
            {label}
          </Label>
        </div>
      ))}
    </CheckboxGroup>
  ),
});

export const Horizontal = meta.story({
  render: () => {
    function Render() {
      const [days, setDays] = useState<Array<string>>(["Mon", "Wed", "Fri"]);

      return (
        <CheckboxGroup className="flex flex-wrap gap-4" value={days} onValueChange={(value) => setDays(value ?? [])}>
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-2">
              <CheckboxGroupItem id={`day-${day}`} value={day} />
              <Label htmlFor={`day-${day}`}>{day}</Label>
            </div>
          ))}
        </CheckboxGroup>
      );
    }

    return <Render />;
  },
});

export const WithDescriptions = meta.story({
  render: () => {
    function Render() {
      const [value, setValue] = useState<Array<string>>(["mentions"]);

      return (
        <CheckboxGroup className="w-full max-w-xs gap-4" value={value} onValueChange={(next) => setValue(next ?? [])}>
          {NOTIFICATIONS.map((item) => (
            <div key={item.value} className="flex items-start gap-3">
              <CheckboxGroupItem id={`notify-${item.value}`} value={item.value} className="mt-0.5" />
              <div className="grid gap-0.5">
                <Label htmlFor={`notify-${item.value}`}>{item.label}</Label>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
            </div>
          ))}
        </CheckboxGroup>
      );
    }

    return <Render />;
  },
});

export const SelectsOnClick = meta.story({
  render: () => (
    <CheckboxGroup className="gap-3">
      {PERMISSIONS.filter(({ disabled }) => !disabled).map(({ value, label }) => (
        <div key={value} className="flex items-center gap-2">
          <CheckboxGroupItem id={`select-${value}`} value={value} />
          <Label htmlFor={`select-${value}`}>{label}</Label>
        </div>
      ))}
    </CheckboxGroup>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("selects on click", async ({ canvas, userEvent }) => {
  const [checkbox] = canvas.getAllByRole("checkbox");

  await expect(checkbox).toBeDefined();
  await expect(checkbox as HTMLElement).not.toBeChecked();
  await userEvent.click(checkbox as HTMLElement);
  await expect(checkbox as HTMLElement).toBeChecked();
});
