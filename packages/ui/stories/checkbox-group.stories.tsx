import { expect, fn } from "storybook/test";

import { CheckboxGroup, CheckboxGroupItem } from "#/components/checkbox-group";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const PERMISSIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "delete", label: "Delete" },
  { value: "admin", label: "Admin", disabled: true },
];

const NOTIFICATIONS = [
  { value: "comments", label: "Comments", hint: "When someone replies to your thread." },
  { value: "mentions", label: "Mentions", hint: "When you're @-mentioned anywhere." },
  { value: "digest", label: "Weekly digest", hint: "A Monday summary of activity." },
];

/**
 * CheckboxGroup — a COMPOSITE whose root (`CheckboxGroup`) is a normal element-backed
 * component owning the group's array value plus roving-focus props (`orientation`, `loop`,
 * `dir`, `disabled`, `required`). The root drives behavior via `{...args}`, so states differ
 * only by `args` and reuse the base render. Content is authored for Storybook, NOT synced
 * with the apps/web registry.
 */
const meta = preview.meta({
  args: {
    defaultValue: ["read"],
    disabled: false,
    loop: true,
    orientation: "vertical",
    required: false,
  },
  argTypes: {
    disabled: { control: "boolean" },
    loop: { control: "boolean" },
    onValueChange: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    required: { control: "boolean" },
    value: { table: { disable: true } },
  },
  component: CheckboxGroup,
  parameters: {
    controls: { include: ["orientation", "loop", "disabled", "required", "defaultValue"] },
    docs: {
      description: {
        component: [
          "A group of checkboxes that share a single array value, allowing multiple selections.",
          "Roving focus moves between items with arrow keys; `loop` wraps at the boundaries.",
          "",
          "**Anatomy:** `CheckboxGroup > CheckboxGroupItem`.",
          "Drive it with `value`/`defaultValue` (an array) + `onValueChange`; pair each item with a `Label`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { CheckboxGroupItem },
  title: "Form/CheckboxGroup",
});

export const Default = meta.story({
  render: (args) => (
    <CheckboxGroup {...args} className={args.orientation === "horizontal" ? "flex flex-wrap gap-4" : "gap-3"}>
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
  args: { orientation: "horizontal" },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

/**
 * A genuinely different composition: each item pairs a label with a hint line. Still driven by
 * the same root `args`.
 */
export const WithDescriptions = meta.story({
  args: { defaultValue: ["mentions"] },
  render: (args) => (
    <CheckboxGroup {...args} className="w-full max-w-xs gap-4">
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
  ),
});

export const SelectsOnClick = meta.story({
  args: { defaultValue: [], onValueChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("toggling an item updates the group value", async ({ args, canvas, userEvent }) => {
  const read = canvas.getByRole("checkbox", { name: "read" });

  await expect(read).not.toBeChecked();

  await userEvent.click(read);
  await expect(read).toBeChecked();
  await expect(args.onValueChange).toHaveBeenCalledWith(["read"]);

  await userEvent.click(read);
  await expect(read).not.toBeChecked();
  await expect(args.onValueChange).toHaveBeenLastCalledWith([]);
});
