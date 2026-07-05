import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { RadioDisabled } from "#/registry/radio/disabled.example";
import { RadioHorizontal } from "#/registry/radio/horizontal.example";
import { RadioSizes } from "#/registry/radio/sizes.example";

export const radioDoc: ComponentDoc = {
  usage: docUsage("radio"),
  examples: [
    {
      id: "sizes",
      title: "Single radios",
      description: "Standalone radios sharing a name; the selected value is echoed below.",
      Demo: RadioSizes,
      source: docSource("radio", "sizes"),
      previewClassName: "items-start",
    },
    {
      id: "horizontal",
      title: "Horizontal",
      description: "Lay standalone radios out in a row.",
      Demo: RadioHorizontal,
      source: docSource("radio", "horizontal"),
    },
    {
      id: "disabled",
      title: "Disabled option",
      description: "Disable an individual choice while keeping it visible.",
      Demo: RadioDisabled,
      source: docSource("radio", "disabled"),
    },
  ],
  anatomy: [{ name: "Radio" }],
  features: [
    'Plain native <input type="radio"> — radios sharing the same name form one exclusive group with zero JS.',
    "A convenience onValueChange(value) callback fires alongside the native onChange.",
    "For a managed, keyboard-navigable single-selection widget, use Radio Group instead.",
  ],
  api: [
    {
      name: "Radio",
      description: "A single native radio input. Use Radio Group for managed groups.",
      props: [
        {
          name: "checked / onValueChange",
          type: "boolean / (value: string) => void",
          description: "Controlled selected state; onValueChange fires with this radio’s value.",
        },
        {
          name: "name",
          type: "string",
          description: "Radios sharing a name form one exclusive group.",
        },
        {
          name: "value",
          type: "string",
          description: "The value submitted when this radio is chosen.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to the radio group." },
      { keys: ["Arrow", "Down"], description: "Selects the next radio in the group." },
    ],
    notes: [
      "Give every radio in a set the same name so only one can be selected.",
      "Pair each radio with a Label via matching id / htmlFor.",
      "For a managed, keyboard-navigable group, prefer Radio Group.",
    ],
  },
  guidelines: {
    do: ["Use Radio Group for most cases; reach for Radio for bespoke layouts.", "Always provide labels."],
    dont: ["Don’t use radios for multi-select.", "Don’t forget the shared name attribute."],
  },
  related: ["radio-group", "radio-cards", "checkbox"],
};
