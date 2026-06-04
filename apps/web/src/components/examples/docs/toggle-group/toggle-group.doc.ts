import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { ToggleGroupAlignment } from "#/components/examples/docs/toggle-group/alignment";
import { ToggleGroupFormatting } from "#/components/examples/docs/toggle-group/formatting";

import { ToggleGroupViews } from "#/components/examples/docs/toggle-group/views";

export const toggleGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "single",
      title: "Single (alignment)",
      description: 'type="single" keeps exactly one button pressed — an alignment toolbar.',
      Demo: ToggleGroupAlignment,
      code: docSource("toggle-group", "alignment"),
    },
    {
      id: "multiple",
      title: "Multiple (text marks)",
      description: 'type="multiple" lets several toggle at once — bold / italic / underline.',
      Demo: ToggleGroupFormatting,
      code: docSource("toggle-group", "formatting"),
    },
    {
      id: "views",
      title: "Text options",
      description: "A single-select view switcher with labels.",
      Demo: ToggleGroupViews,
      code: docSource("toggle-group", "views"),
    },
  ],
  anatomy: docAnatomy("toggle-group"),
  api: [
    {
      name: "ToggleGroup",
      description: "A set of related toggles sharing one value.",
      props: [
        {
          name: "type",
          type: '"single" | "multiple"',
          description: "Single makes value a string; multiple makes it a string[].",
        },
        {
          name: "value / onValueChange",
          type: "string | string[] / (value) => void",
          description: "Controlled pressed item(s). In single mode value can be empty.",
        },
        {
          name: "variant",
          type: '"default" | "outline"',
          default: '"default"',
          description: "Visual style of the buttons.",
        },
        {
          name: "size",
          type: '"sm" | "default" | "lg"',
          default: '"default"',
          description: "Button size for the whole group.",
        },
      ],
    },
    {
      name: "ToggleGroupItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "Identifier for this toggle (required).",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus into the group." },
      { keys: ["Arrow", "Right"], description: "Moves to the next toggle." },
      { keys: ["Arrow", "Left"], description: "Moves to the previous toggle." },
      { keys: ["Space"], description: "Toggles the focused button." },
    ],
    notes: [
      "Single mode behaves as a radio group; multiple mode as a set of toggle buttons.",
      "Icon-only items must carry an aria-label, since there’s no visible text.",
      "In single mode, guard onValueChange against the empty string to keep a selection.",
    ],
  },
  guidelines: {
    do: [
      "Use single for mutually-exclusive choices (alignment).",
      "Use multiple for independent marks (bold, italic).",
    ],
    dont: [
      "Don’t mix unrelated actions into one group.",
      "Don’t leave icon items without an accessible label.",
    ],
  },
  related: ["toggle", "button-group", "radio-group"],
};
