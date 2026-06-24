import { expect } from "storybook/test";

import { Label } from "#/components/label";
import { Switch } from "#/components/switch";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { defaultChecked: false, disabled: false, size: "default" },
  argTypes: {
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    size: { control: "radio", options: ["default", "sm"] },
  },
  component: Switch,
  parameters: {
    controls: { include: ["size", "defaultChecked", "disabled"] },
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
});

export const Checked = meta.story({
  args: { defaultChecked: true },
});

export const Disabled = meta.story({
  args: { disabled: true },
});

export const Invalid = meta.story({
  args: { "aria-invalid": true },
});

export const TogglesOnClick = meta.story({
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="switch-test" />
      <Label htmlFor="switch-test">Notifications</Label>
    </div>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
TogglesOnClick.test("toggles on click", async ({ canvas, userEvent }) => {
  const control = canvas.getByRole("switch");

  await userEvent.click(control);
  await expect(control).toBeChecked();
});
