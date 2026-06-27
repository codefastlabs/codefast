import { expect, fn } from "storybook/test";

import { Checkbox } from "#/components/checkbox";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

/**
 * Checkbox — a prop-driven leaf built on Radix `Checkbox.Root`. The root owns
 * every interesting prop (`checked`/`defaultChecked`, `disabled`, `aria-invalid`)
 * and renders a single box; the only composition here is pairing it with a
 * `Label` for an accessible click target. Content is authored against the
 * component's own public API for Storybook — NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultChecked: false, disabled: false },
  argTypes: {
    asChild: { table: { disable: true } },
    checked: { table: { disable: true } },
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    onCheckedChange: { table: { disable: true } },
  },
  component: Checkbox,
  parameters: {
    controls: { include: ["defaultChecked", "disabled"] },
    docs: {
      description: {
        component:
          "A control that lets the user toggle a single option on or off, with an extra `indeterminate` tri-state. Pair it with a `Label` via shared `id`/`htmlFor` so the label text becomes a click target.\n\n**Anatomy:** `Checkbox` + `Label` (associated by `id`/`htmlFor`).",
      },
    },
  },
  title: "Form/Checkbox",
});

export const Default = meta.story({
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-default" {...args} />
      <Label htmlFor="checkbox-default">Accept terms and conditions</Label>
    </div>
  ),
});

export const Checked = meta.story({
  args: { defaultChecked: true },
  render: Default.input.render,
});

export const Indeterminate = meta.story({
  args: { checked: "indeterminate" },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const Invalid = meta.story({
  args: { "aria-invalid": true },
  render: Default.input.render,
});

export const TogglesOnClick = meta.story({
  args: { onCheckedChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
TogglesOnClick.test("toggles checked state and fires onCheckedChange", async ({ args, canvas, userEvent }) => {
  const checkbox = canvas.getByRole("checkbox");

  await expect(checkbox).not.toBeChecked();

  await userEvent.click(checkbox);
  await expect(checkbox).toBeChecked();
  await expect(args.onCheckedChange).toHaveBeenCalledWith(true);

  await userEvent.click(checkbox);
  await expect(checkbox).not.toBeChecked();
});
