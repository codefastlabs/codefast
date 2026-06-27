import { expect, fn } from "storybook/test";

import { Label } from "#/components/label";
import { Switch } from "#/components/switch";

import preview from "../.storybook/preview";

/**
 * Switch — a prop-driven leaf toggle (Radix Switch root). The root owns every
 * interesting prop (`size`, `disabled`, `defaultChecked`, `aria-invalid`) and is
 * driven directly by `{...args}`; the surrounding `Label` is a sibling for
 * accessible, clickable labelling. Content here is authored against the
 * component's own public API for Storybook — it is NOT synced with the apps/web
 * registry.
 */
const meta = preview.meta({
  args: { defaultChecked: false, disabled: false, size: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
    checked: { table: { disable: true } },
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    onCheckedChange: { table: { disable: true } },
    size: { control: "radio", options: ["default", "sm"] },
  },
  component: Switch,
  parameters: {
    controls: { include: ["size", "defaultChecked", "disabled"] },
    docs: {
      description: {
        component:
          "A control that toggles between on and off, built on Radix Switch. Comes in `default` and `sm` sizes and supports `disabled`, `defaultChecked`, and `aria-invalid` states.\n\n**Anatomy:** `Switch` paired with a sibling `Label` (linked via `htmlFor`/`id`).",
      },
    },
  },
  title: "Form/Switch",
});

export const Default = meta.story({
  render: (args) => (
    <div className="flex items-center gap-3">
      <Switch id="switch-default" {...args} />
      <Label htmlFor="switch-default">Notifications</Label>
    </div>
  ),
});

export const Small = meta.story({
  args: { size: "sm" },
  render: Default.input.render,
});

export const Checked = meta.story({
  args: { defaultChecked: true },
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
TogglesOnClick.test("flips checked state and fires onCheckedChange", async ({ args, canvas, userEvent }) => {
  const control = canvas.getByRole("switch");

  await expect(control).not.toBeChecked();

  await userEvent.click(control);

  await expect(control).toBeChecked();
  await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
});
