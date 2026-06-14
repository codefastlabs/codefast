import { ProgressControlled } from "#/registry/progress/controlled.example";
import { ProgressWithLabel } from "#/registry/progress/label.example";
import { ProgressRtl } from "#/registry/progress/rtl.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const progressDoc: ComponentDoc = {
  examples: [
    {
      id: "progress-controlled",
      title: "Controlled",
      description: "A progress bar that can be controlled by a slider.",
      Demo: ProgressControlled,
      source: docSource("progress", "controlled"),
    },
    {
      id: "progress-label",
      title: "Label",
      description: "Use a Field component to add a label to the progress bar.",
      Demo: ProgressWithLabel,
      source: docSource("progress", "label"),
    },
    {
      id: "progress-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ProgressRtl,
      source: docSource("progress", "rtl"),
      direction: "rtl",
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
