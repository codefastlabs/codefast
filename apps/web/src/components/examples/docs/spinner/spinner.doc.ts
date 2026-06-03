import type { ComponentDoc } from "#/components/examples/docs/types";
import {
  spinnerAnatomyCode,
  spinnerInButtonCode,
  spinnerSizesCode,
} from "#/components/examples/codes";
import { SpinnerInButton } from "#/components/examples/docs/spinner/in-button";
import { SpinnerSizes } from "#/components/examples/docs/spinner/sizes";

export const spinnerDoc: ComponentDoc = {
  examples: [
    {
      id: "sizes",
      title: "Sizes",
      description:
        "Size and colour the spinner with className — it inherits the current text colour.",
      Demo: SpinnerSizes,
      code: spinnerSizesCode,
    },
    {
      id: "in-button",
      title: "In a button & with a label",
      description: "Drop it into a disabled button, or pass children as a screen-reader label.",
      Demo: SpinnerInButton,
      code: spinnerInButtonCode,
    },
  ],
  anatomy: spinnerAnatomyCode,
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
    do: [
      "Use for short, indeterminate waits.",
      "Pair with disabled controls while an action is in flight.",
    ],
    dont: [
      "Don’t use a spinner for long, measurable tasks — use Progress.",
      "Don’t show a bare spinner with no context about what’s loading.",
    ],
  },
  related: ["progress", "progress-circle", "skeleton"],
};
