import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Label } from "#/components/label";
import { Switch } from "#/components/switch";

const meta = {
  component: Switch,
  title: "Form/Switch",
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Render() {
      const [switched, setSwitched] = useState(true);

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch id="sw1" checked={switched} onCheckedChange={setSwitched} />
            <Label htmlFor="sw1">Notifications {switched ? "on" : "off"}</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="sw2" defaultChecked />
            <Label htmlFor="sw2">Marketing emails</Label>
          </div>
        </div>
      );
    }

    return <Render />;
  },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Checked: Story = {
  args: { defaultChecked: true },
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
    <div className="flex items-center gap-3">
      <Switch id="switch-test" />
      <Label htmlFor="switch-test">Notifications</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch");

    await userEvent.click(control);
    await expect(control).toBeChecked();
  },
};
