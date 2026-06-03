import type { ComponentDoc } from "#/components/examples/docs/types";
import {
  progressAnatomyCode,
  progressAnimatedCode,
  progressColorsCode,
} from "#/components/examples/codes";
import { ProgressAnimated } from "#/components/examples/docs/progress/animated";
import { ProgressColors } from "#/components/examples/docs/progress/colors";

export const progressDoc: ComponentDoc = {
  examples: [
    {
      id: "animated",
      title: "Animated",
      description: "Press Start — the value climbs over time and the indicator animates smoothly.",
      Demo: ProgressAnimated,
      code: progressAnimatedCode,
    },
    {
      id: "colors",
      title: "Themed bars",
      description: "Recolour the indicator slot per threshold to signal healthy → critical.",
      Demo: ProgressColors,
      code: progressColorsCode,
    },
  ],
  anatomy: progressAnatomyCode,
  api: [
    {
      name: "Progress",
      description: "A determinate progress bar built on Radix Progress.",
      props: [
        {
          name: "value",
          type: "number",
          default: "0",
          description: "Current progress from 0 to max.",
        },
        {
          name: "max",
          type: "number",
          default: "100",
          description: "Upper bound of value.",
        },
        {
          name: "className",
          type: "string",
          description:
            "Style the indicator via **:data-[slot=progress-indicator] to change its colour.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Has role=progressbar with aria-valuenow / valuemin / valuemax set for you.",
      "Pair with a visible label or percentage — don’t rely on the bar alone.",
      "For unknown-duration work, prefer a Spinner over a fake-moving bar.",
    ],
  },
  guidelines: {
    do: [
      "Use for determinate tasks where you know the percentage.",
      "Show the percentage or step count next to the bar.",
    ],
    dont: [
      "Don’t animate a bar with no real progress to fake activity.",
      "Don’t use colour as the only signal of a critical threshold.",
    ],
  },
  related: ["progress-circle", "spinner", "slider"],
};
