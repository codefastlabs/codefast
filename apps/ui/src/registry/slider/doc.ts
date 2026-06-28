import { SliderControlled } from "#/registry/slider/controlled.example";
import { SliderDisabled } from "#/registry/slider/disabled.example";
import { SliderMultiple } from "#/registry/slider/multiple.example";
import { SliderRange } from "#/registry/slider/range.example";
import { SliderRtl } from "#/registry/slider/rtl.example";
import { SliderVertical } from "#/registry/slider/vertical.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const sliderDoc: ComponentDoc = {
  examples: [
    {
      id: "range",
      title: "Range (two thumbs)",
      description: "Pass an array of two values to get a min–max range, e.g. a price filter.",
      Demo: SliderRange,
      source: docSource("slider", "range"),
    },
    {
      id: "slider-controlled",
      title: "Controlled",
      description: "An input where the user selects a value from within a given range.",
      Demo: SliderControlled,
      source: docSource("slider", "controlled"),
    },
    {
      id: "slider-disabled",
      title: "Disabled",
      description: "Use the disabled prop to disable the slider.",
      Demo: SliderDisabled,
      source: docSource("slider", "disabled"),
    },
    {
      id: "slider-multiple",
      title: "Multiple Thumbs",
      description: "Use an array with multiple values for multiple thumbs.",
      Demo: SliderMultiple,
      source: docSource("slider", "multiple"),
    },
    {
      id: "slider-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SliderRtl,
      source: docSource("slider", "rtl"),
      direction: "rtl",
    },
    {
      id: "slider-vertical",
      title: "Vertical",
      description: "Use orientation='vertical' for a vertical slider.",
      Demo: SliderVertical,
      source: docSource("slider", "vertical"),
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
