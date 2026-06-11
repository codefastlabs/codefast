import { ProgressAnimated } from "#/components/examples/docs/progress/animated";
import { ProgressColors } from "#/components/examples/docs/progress/colors";
import { ProgressLabeled } from "#/components/examples/docs/progress/labeled";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const progressDoc: ComponentDoc = {
  examples: [
    {
      id: "animated",
      title: "Animated",
      description: "Press Start — the value climbs over time and the indicator animates smoothly.",
      Demo: ProgressAnimated,
      source: docSource("progress", "animated"),
    },
    {
      id: "colors",
      title: "Themed bars",
      description: "Recolour the indicator slot per threshold to signal healthy → critical.",
      Demo: ProgressColors,
      source: docSource("progress", "colors"),
    },
    {
      id: "labeled",
      title: "With labels",
      description: "Pair each bar with a name and a percentage.",
      Demo: ProgressLabeled,
      source: docSource("progress", "labeled"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("progress"),
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
          description: "Style the indicator via **:data-[slot=progress-indicator] to change its colour.",
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
