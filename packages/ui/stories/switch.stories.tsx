import { useState } from "react";
import { expect } from "storybook/test";

import { Label } from "#/components/label";
import { Switch } from "#/components/switch";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Switch,
  title: "Form/Switch",
});

export const Default = meta.story({
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
