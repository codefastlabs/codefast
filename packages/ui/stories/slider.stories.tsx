import { Volume2Icon } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { expect } from "storybook/test";

import { Label } from "#/components/label";
import { Slider } from "#/components/slider";

import preview from "../.storybook/preview";

/**
 * Slider's root takes `defaultValue`/`value`, so the interesting demos are
 * stateful — render via composition. Controlled stories use a small wrapper.
 */
function VolumeAndRangeSlider(): JSX.Element {
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
          <span className="font-medium">{volume[0]}%</span>
        </div>
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Price range</span>
          <span className="font-medium">
            ${range[0]} – ${range[1]}
          </span>
        </div>
        <Slider value={range} onValueChange={setRange} min={0} max={1000} step={10} />
      </div>
    </div>
  );
}

function TemperatureSlider(): JSX.Element {
  const [value, setValue] = useState([0.3, 0.7]);

  return (
    <div className="mx-auto grid w-full max-w-xs gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="slider-temperature">Temperature</Label>
        <span className="text-sm text-muted-foreground">{value.join(", ")}</span>
      </div>
      <Slider id="slider-temperature" value={value} onValueChange={setValue} min={0} max={1} step={0.1} />
    </div>
  );
}

const meta = preview.meta({
  title: "Form/Slider",
});

export const Default = meta.story({
  render: () => <VolumeAndRangeSlider />,
});

export const Controlled = meta.story({
  render: () => <TemperatureSlider />,
});

export const Multiple = meta.story({
  render: () => <Slider defaultValue={[10, 20, 70]} max={100} step={10} className="mx-auto w-full max-w-xs" />,
});

export const Disabled = meta.story({
  render: () => <Slider defaultValue={[50]} max={100} step={1} disabled className="mx-auto w-full max-w-xs" />,
});

export const Vertical = meta.story({
  render: () => (
    <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-6">
      <Slider defaultValue={[50]} max={100} step={1} orientation="vertical" className="h-40" />
      <Slider defaultValue={[25]} max={100} step={1} orientation="vertical" className="h-40" />
    </div>
  ),
});

export const ArrowKeyChangesValue = meta.story({
  render: () => <Slider defaultValue={[50]} max={100} step={1} className="mx-auto w-full max-w-xs" />,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ArrowKeyChangesValue.test("arrow key changes value", async ({ canvas, userEvent }) => {
  const thumb = canvas.getByRole("slider");

  thumb.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect(thumb).toHaveAttribute("aria-valuenow", "51");
});
