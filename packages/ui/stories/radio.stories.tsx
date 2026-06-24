import { useState } from "react";
import { expect } from "storybook/test";

import { Label } from "#/components/label";
import { Radio } from "#/components/radio";

import preview from "../.storybook/preview";

const VOTES = ["Yes", "No", "Maybe"];

/**
 * Radio is a native input grouped by `name` and driven by `onValueChange`, so
 * stories are demoed via `render` (see Accordion).
 */
const meta = preview.meta({
  args: { defaultChecked: false, disabled: false },
  argTypes: {
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  component: Radio,
  parameters: {
    controls: { include: ["defaultChecked", "disabled"] },
  },
  title: "Form/Radio",
});

export const Default = meta.story({
  render: (args) => (
    <div className="flex items-center gap-2">
      <Radio id="radio-default" name="radio-default" value="default" {...args} />
      <Label htmlFor="radio-default">Medium</Label>
    </div>
  ),
});

export const Horizontal = meta.story({
  render: () => {
    function Render() {
      const [value, setValue] = useState("Yes");

      return (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {VOTES.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <Radio
                id={`vote-${option}`}
                name="vote"
                value={option}
                checked={value === option}
                onValueChange={(next) => setValue(next)}
              />
              <Label htmlFor={`vote-${option}`}>{option}</Label>
            </div>
          ))}
        </div>
      );
    }

    return <Render />;
  },
});

export const Disabled = meta.story({
  render: () => {
    function Render() {
      const [value, setValue] = useState("available");

      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Radio
              id="ship-available"
              name="shipping"
              value="available"
              checked={value === "available"}
              onValueChange={(next) => setValue(next)}
            />
            <Label htmlFor="ship-available">Standard — in stock</Label>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <Radio id="ship-soldout" name="shipping" value="soldout" disabled checked={false} />
            <Label htmlFor="ship-soldout">Overnight — sold out</Label>
          </div>
        </div>
      );
    }

    return <Render />;
  },
});

export const ChecksOnClick = meta.story({
  render: () => (
    <div className="flex flex-col gap-3">
      {VOTES.map((option) => (
        <div key={option} className="flex items-center gap-2">
          <Radio id={`pick-${option}`} name="pick" value={option} defaultChecked={option === "No"} />
          <Label htmlFor={`pick-${option}`}>{option}</Label>
        </div>
      ))}
    </div>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ChecksOnClick.test("checks on click", async ({ canvas, userEvent }) => {
  const radio = canvas.getByRole("radio", { name: "Yes" });

  await userEvent.click(radio);
  await expect(radio).toBeChecked();
});
