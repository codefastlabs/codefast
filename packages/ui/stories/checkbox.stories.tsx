import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Checkbox } from "#/components/checkbox";
import { Label } from "#/components/label";

const meta = {
  component: Checkbox,
  title: "Form/Checkbox",
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Render() {
      const [checked, setChecked] = useState(false);

      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Checkbox id="c1" checked={checked} onCheckedChange={(value) => setChecked(Boolean(value))} />
            <Label htmlFor="c1">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="c2" defaultChecked />
            <Label htmlFor="c2">Subscribe to newsletter</Label>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <Checkbox id="c3" disabled />
            <Label htmlFor="c3">Disabled option</Label>
          </div>
        </div>
      );
    }

    return <Render />;
  },
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { checked: "indeterminate" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { "aria-invalid": true },
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const TogglesOnClick: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="check-test" />
      <Label htmlFor="check-test">Accept terms</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};
