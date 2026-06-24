import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Label } from "#/components/label";
import { Radio } from "#/components/radio";

const SIZES = ["Small", "Medium", "Large"] as const;
type Size = (typeof SIZES)[number];

const VOTES = ["Yes", "No", "Maybe"];

/**
 * Radio is a native input grouped by `name` and driven by `onValueChange`, so
 * stories are demoed via `render` (see Accordion).
 */
const meta = {
  component: Radio,
  title: "Form/Radio",
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Render() {
      const [selected, setSelected] = useState<Size>("Medium");

      return (
        <div className="flex flex-col gap-3">
          {SIZES.map((size) => (
            <div key={size} className="flex items-center gap-2">
              <Radio
                checked={selected === size}
                id={`radio-size-${size}`}
                name="size"
                value={size}
                onValueChange={(value) => {
                  setSelected(value as Size);
                }}
              />
              <Label htmlFor={`radio-size-${size}`}>{size}</Label>
            </div>
          ))}
        </div>
      );
    }

    return <Render />;
  },
};

export const Horizontal: Story = {
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
};

export const Disabled: Story = {
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
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const ChecksOnClick: Story = {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByRole("radio", { name: "Yes" });

    await userEvent.click(radio);
    await expect(radio).toBeChecked();
  },
};
