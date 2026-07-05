import { ProgressCircleAnimated } from "#/registry/progress-circle/animated.example";
import { ProgressCircleDashboard } from "#/registry/progress-circle/dashboard.example";
import { ProgressCircleValues } from "#/registry/progress-circle/values.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const progressCircleDoc: ComponentDoc = {
  usage: docUsage("progress-circle"),
  examples: [
    {
      id: "animated",
      title: "Animated",
      description: "Press Start — the ring fills over time with the value shown in the centre.",
      Demo: ProgressCircleAnimated,
      source: docSource("progress-circle", "animated"),
    },
    {
      id: "values",
      title: "Fixed values",
      description: "Any value 0–100; toggle showValue to print the number inside.",
      Demo: ProgressCircleValues,
      source: docSource("progress-circle", "values"),
    },
    {
      id: "dashboard",
      title: "Labeled metrics",
      description: "Group circles into a compact metrics dashboard.",
      Demo: ProgressCircleDashboard,
      source: docSource("progress-circle", "dashboard"),
    },
  ],
  anatomy: [{ name: "ProgressCircle" }],
  features: [
    "Five preset sizes (sm/md/lg/xl/2xl, 32–128px) or an exact sizeInPixels override; stroke width scales with size unless set explicitly via strokeWidth.",
    "Three thickness presets (thin/regular/thick) computed as a percentage of the circle's diameter, not a fixed pixel value.",
    "Animates value changes over animationDuration (default 1000ms); disable with animate={false} for an instant jump.",
    'customLabel({ value }) replaces the default "N%" center text with your own render.',
  ],
  api: [
    {
      name: "ProgressCircle",
      description: "A circular determinate progress indicator.",
      props: [
        {
          name: "value",
          type: "number",
          default: "0",
          description: "Progress from 0 to 100.",
        },
        {
          name: "showValue",
          type: "boolean",
          default: "false",
          description: "Render the numeric value in the centre.",
        },
        {
          name: "size",
          type: "number",
          description: "Diameter in pixels (overrides the size variant).",
        },
        {
          name: "customLabel",
          type: "({ value }) => JSX.Element",
          description: "Render your own centre label instead of the number.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Has role=progressbar with the value mirrored for assistive tech.",
      "If showValue is off, describe progress nearby so it isn’t only visual.",
      "Use a Spinner for indeterminate waits where there’s no percentage.",
    ],
  },
  guidelines: {
    do: ["Use in compact spots — cards, avatars, dashboards.", "Show the value for precise, glanceable feedback."],
    dont: ["Don’t use for indeterminate progress.", "Don’t rely on colour alone to signal a threshold."],
  },
  related: ["progress", "spinner", "slider"],
};
