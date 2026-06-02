import type { ComponentDoc } from "#/components/examples/docs/types";
import { sliderRangeCode, sliderVolumeCode } from "#/components/examples/codes";
import { SliderRange } from "#/components/examples/docs/slider/range";
import { SliderVolume } from "#/components/examples/docs/slider/volume";

export const sliderDoc: ComponentDoc = {
  examples: [
    {
      id: "volume",
      title: "Single value",
      description: "A volume control: an icon that reacts to the value and a live percentage.",
      Demo: SliderVolume,
      code: sliderVolumeCode,
    },
    {
      id: "range",
      title: "Range (two thumbs)",
      description: "Pass an array of two values to get a min–max range, e.g. a price filter.",
      Demo: SliderRange,
      code: sliderRangeCode,
    },
  ],
  anatomy: `import { Slider } from "@codefast/ui/slider";

// single
<Slider value={[60]} onValueChange={setValue} max={100} />

// range — two thumbs
<Slider value={[200, 700]} onValueChange={setRange} max={1000} />`,
  api: [
    {
      name: "Slider",
      description: "Built on Radix Slider. The number of thumbs follows the length of value.",
      props: [
        {
          name: "value / onValueChange",
          type: "number[] / (value: number[]) => void",
          description: "Controlled thumb positions. Two entries render a range.",
        },
        {
          name: "defaultValue",
          type: "number[]",
          description: "Initial positions when uncontrolled.",
        },
        {
          name: "min / max",
          type: "number",
          default: "0 / 100",
          description: "Bounds of the track.",
        },
        {
          name: "step",
          type: "number",
          default: "1",
          description: "Granularity the thumb snaps to.",
        },
        {
          name: "orientation",
          type: '"horizontal" | "vertical"',
          default: '"horizontal"',
          description: "Axis of the slider.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus between thumbs." },
      { keys: ["Arrow", "Right"], description: "Increases the focused thumb by one step." },
      { keys: ["Arrow", "Left"], description: "Decreases the focused thumb by one step." },
      { keys: ["Home"], description: "Sets the thumb to its minimum." },
      { keys: ["End"], description: "Sets the thumb to its maximum." },
    ],
    notes: [
      "Each thumb is a slider role with aria-valuenow / valuemin / valuemax set automatically.",
      "Give the Slider an aria-label (or aria-labelledby) so the purpose is announced.",
      "Pair with a visible readout so the current value is not conveyed by position alone.",
    ],
  },
  guidelines: {
    do: [
      "Show the current value (or range) near the slider.",
      "Pick a step that matches the precision users actually need.",
    ],
    dont: [
      "Don’t use a slider for precise numeric entry — use Input Number.",
      "Don’t hide which thumb is which in a range without labels or a readout.",
    ],
  },
  related: ["input-number", "progress", "switch"],
};
