import { RadioGroupDensity } from "#/registry/radio-group/density.example";
import { RadioGroupHorizontal } from "#/registry/radio-group/horizontal.example";
import { RadioGroupPlans } from "#/registry/radio-group/plans.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const radioGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "density",
      title: "Controlled single-select",
      description: "Exactly one option is selected; the choice is echoed live below.",
      Demo: RadioGroupDensity,
      source: docSource("radio-group", "density"),
      previewClassName: "items-start",
    },
    {
      id: "plans",
      title: "Selectable cards",
      description: "Wrap each option in a Label card that highlights when checked.",
      Demo: RadioGroupPlans,
      source: docSource("radio-group", "plans"),
      previewClassName: "items-start",
    },
    {
      id: "horizontal",
      title: "Horizontal",
      description: "Arrange options in a single row.",
      Demo: RadioGroupHorizontal,
      source: docSource("radio-group", "horizontal"),
    },
  ],
  anatomy: docAnatomy("radio-group"),
  api: [
    {
      name: "RadioGroup",
      description: "A single-selection group of radio items.",
      props: [
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "Controlled selection and its handler.",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "Initial selection when uncontrolled.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the whole group.",
        },
      ],
    },
    {
      name: "RadioGroupItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "Identifier selected when this item is chosen (required).",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus into the group." },
      { keys: ["Arrow", "Down"], description: "Selects the next item." },
      { keys: ["Arrow", "Up"], description: "Selects the previous item." },
    ],
    notes: [
      "Implements the ARIA radiogroup pattern with roving focus.",
      "Pair each RadioGroupItem with a Label via matching id / htmlFor.",
      "Arrow keys both move focus and change selection — that’s expected for radios.",
    ],
  },
  guidelines: {
    do: ["Use for 2–7 mutually-exclusive options shown at once.", "Pre-select a sensible default."],
    dont: [
      "Don’t use radios for multi-select — use Checkbox Group.",
      "Don’t use a radio group when a Select saves space and the list is long.",
    ],
  },
  related: ["radio-cards", "select", "checkbox-group"],
};
