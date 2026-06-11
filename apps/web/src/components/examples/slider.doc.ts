import { SliderRange } from "#/components/examples/slider.range";
import { SliderStepped } from "#/components/examples/slider.stepped";
import { SliderVolume } from "#/components/examples/slider.volume";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const sliderDoc: ComponentDoc = {
  examples: [
    {
      id: "volume",
      title: "Single value",
      description: "A volume control: an icon that reacts to the value and a live percentage.",
      Demo: SliderVolume,
      source: docSource("slider", "volume"),
    },
    {
      id: "range",
      title: "Range (two thumbs)",
      description: "Pass an array of two values to get a min–max range, e.g. a price filter.",
      Demo: SliderRange,
      source: docSource("slider", "range"),
    },
    {
      id: "stepped",
      title: "Stepped with marks",
      description: "Snap to steps and label each stop.",
      Demo: SliderStepped,
      source: docSource("slider", "stepped"),
    },
  ],
  anatomy: docAnatomy("slider"),
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
