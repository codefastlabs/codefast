import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { SpinnerBadge } from "#/registry/spinner/badge.example";
import { SpinnerButton } from "#/registry/spinner/button.example";
import { SpinnerCustom } from "#/registry/spinner/custom.example";
import { SpinnerEmpty } from "#/registry/spinner/empty.example";
import { SpinnerInputGroup } from "#/registry/spinner/input-group.example";
import { SpinnerRtl } from "#/registry/spinner/rtl.example";
import { SpinnerSize } from "#/registry/spinner/size.example";

export const spinnerDoc: ComponentDoc = {
  usage: docUsage("spinner"),
  examples: [
    {
      id: "spinner-badge",
      title: "Badge",
      description:
        "Add a spinner to a badge to indicate a loading state. Place the <Spinner /> before the label with data-icon='inline-start' for a start position, or after the label with data-icon='inline-end' for an end position.",
      Demo: SpinnerBadge,
      source: docSource("spinner", "badge"),
    },
    {
      id: "spinner-button",
      title: "Button",
      description:
        "Add a spinner to a button to indicate a loading state. Place the <Spinner /> before the label with data-icon='inline-start' for a start position, or after the label with data-icon='inline-end' for an end position.",
      Demo: SpinnerButton,
      source: docSource("spinner", "button"),
    },
    {
      id: "spinner-custom",
      title: "Customization",
      description: "Replace the default spinner icon with any other icon.",
      Demo: SpinnerCustom,
      source: docSource("spinner", "custom"),
    },
    {
      id: "spinner-empty",
      title: "Empty",
      description: "An indicator that can be used to show a loading state.",
      Demo: SpinnerEmpty,
      source: docSource("spinner", "empty"),
    },
    {
      id: "spinner-input-group",
      title: "Input Group",
      description: "An indicator that can be used to show a loading state.",
      Demo: SpinnerInputGroup,
      source: docSource("spinner", "input-group"),
    },
    {
      id: "spinner-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SpinnerRtl,
      source: docSource("spinner", "rtl"),
      direction: "rtl",
    },
    {
      id: "spinner-size",
      title: "Size",
      description: "Use the size-* utility class to change the size of the spinner.",
      Demo: SpinnerSize,
      source: docSource("spinner", "size"),
    },
  ],
  anatomy: [{ name: "Spinner" }],
  features: [
    "With children and loading=true, it hides them invisibly (keeping their layout size) and overlays the spinner on top — a VisuallyHidden copy keeps the label announced to screen readers.",
    "loading={false} renders the children directly in place of the spinner, so a single component can toggle between the two states.",
    "Respects prefers-reduced-motion — the animation pauses automatically.",
  ],
  api: [
    {
      name: "Spinner",
      description: "An indeterminate loading indicator.",
      props: [
        {
          name: "loading",
          type: "boolean",
          default: "true",
          description: "When false, renders children instead of the spinner.",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "Used as a visually-hidden label while spinning.",
        },
        {
          name: "className",
          type: "string",
          description: "Set the size (e.g. size-5) and colour.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Give the spinner a label via children so its purpose is announced.",
      "Prefer a Spinner over a fake progress bar when you don’t know the duration.",
      "Respect reduced motion — the animation is paused under prefers-reduced-motion.",
    ],
  },
  guidelines: {
    do: ["Use for short, indeterminate waits.", "Pair with disabled controls while an action is in flight."],
    dont: [
      "Don’t use a spinner for long, measurable tasks — use Progress.",
      "Don’t show a bare spinner with no context about what’s loading.",
    ],
  },
  related: ["progress", "progress-circle", "skeleton"],
};
