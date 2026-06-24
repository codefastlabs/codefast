import { expect } from "storybook/test";

import { Checkbox } from "#/components/checkbox";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { defaultChecked: false, disabled: false },
  argTypes: {
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  component: Checkbox,
  parameters: {
    controls: { include: ["defaultChecked", "disabled"] },
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
});

export const Indeterminate = meta.story({
  args: { checked: "indeterminate" },
});

export const Disabled = meta.story({
  args: { disabled: true },
});

export const Invalid = meta.story({
  args: { "aria-invalid": true },
});

export const TogglesOnClick = meta.story({
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="check-test" />
      <Label htmlFor="check-test">Accept terms</Label>
    </div>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
TogglesOnClick.test("toggles on click", async ({ canvas, userEvent }) => {
  const checkbox = canvas.getByRole("checkbox");

  await userEvent.click(checkbox);
  await expect(checkbox).toBeChecked();
});
