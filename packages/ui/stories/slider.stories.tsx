import { Volume2Icon } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { expect } from "storybook/test";

import { Label } from "#/components/label";
import { Slider } from "#/components/slider";

import preview from "../.storybook/preview";

/**
 * Slider — a prop-driven leaf wrapping Radix Slider. The root owns every
 * interesting prop (`min`/`max`/`step`/`orientation`/`disabled`/`defaultValue`),
 * so simple states differ only by `args` and share one render. Stateful demos
 * (controlled value, multi-thumb range) use small wrappers. Content is authored
 * for Storybook against the component's own API, independent of the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultValue: [50], disabled: false, max: 100, min: 0, orientation: "horizontal", step: 1 },
  argTypes: {
    asChild: { table: { disable: true } },
    defaultValue: { control: "object" },
    disabled: { control: "boolean" },
    max: { control: "number" },
    min: { control: "number" },
    onValueChange: { table: { disable: true } },
    onValueCommit: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    step: { control: "number" },
    value: { table: { disable: true } },
  },
  component: Slider,
  parameters: {
    controls: { include: ["defaultValue", "min", "max", "step", "orientation", "disabled"] },
    docs: {
      description: {
        component:
          "An input where the user selects a value (or range) from within a given range by dragging a thumb. Supports multiple thumbs, horizontal/vertical orientation, and a configurable step.",
      },
    },
  },
  title: "Form/Slider",
});

export const Default = meta.story({
  render: (args) => (
    <Slider {...args} className={args.orientation === "vertical" ? "mx-auto h-40" : "mx-auto w-full max-w-xs"} />
  ),
});

export const Multiple = meta.story({
  args: { defaultValue: [10, 20, 70], step: 10 },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { disabled: true },
  render: Default.input.render,
});

export const Vertical = meta.story({
  args: { orientation: "vertical" },
  render: Default.input.render,
});

/** A controlled multi-thumb composition wiring `value`/`onValueChange` into local state. */
function ControlledSliders(): JSX.Element {
  const [volume, setVolume] = useState([60]);
  const [range, setRange] = useState([200, 800]);

  return (
    <div className="w-full max-w-xs space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Volume2Icon className="size-4 text-muted-foreground" />
            Volume
          </span>
          <span className="font-medium text-foreground">{volume[0]}%</span>
        </div>
        <Slider max={100} step={1} value={volume} onValueChange={setVolume} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Price range</span>
          <span className="font-medium text-foreground">
            ${range[0]} – ${range[1]}
          </span>
        </div>
        <Slider max={1000} min={0} step={10} value={range} onValueChange={setRange} />
      </div>
    </div>
  );
}

export const Controlled = meta.story({
  render: () => <ControlledSliders />,
});

/** A labelled fractional-step slider bound to React state. */
function TemperatureSlider(): JSX.Element {
  const [value, setValue] = useState([0.3, 0.7]);

  return (
    <div className="mx-auto grid w-full max-w-xs gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="slider-temperature">Temperature</Label>
        <span className="text-sm text-muted-foreground">{value.join(", ")}</span>
      </div>
      <Slider id="slider-temperature" max={1} min={0} step={0.1} value={value} onValueChange={setValue} />
    </div>
  );
}

export const Temperature = meta.story({
  render: () => <TemperatureSlider />,
});

export const ArrowKeyChangesValue = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ArrowKeyChangesValue.test("arrow key advances aria-valuenow by step", async ({ canvas, userEvent }) => {
  const thumb = canvas.getByRole("slider");

  await expect(thumb).toHaveAttribute("aria-valuenow", "50");
  thumb.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect(thumb).toHaveAttribute("aria-valuenow", "51");
});
