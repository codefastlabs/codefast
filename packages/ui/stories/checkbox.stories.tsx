import { useState } from "react";
import { expect } from "storybook/test";

import { Checkbox } from "#/components/checkbox";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Checkbox,
  title: "Form/Checkbox",
});

export const Default = meta.story({
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
