import { RadioGroupChoiceCard } from "#/registry/radio-group/choice-card.example";
import { RadioGroupDescription } from "#/registry/radio-group/description.example";
import { RadioGroupDisabled } from "#/registry/radio-group/disabled.example";
import { RadioGroupFieldset } from "#/registry/radio-group/fieldset.example";
import { RadioGroupInvalid } from "#/registry/radio-group/invalid.example";
import { RadioGroupRtl } from "#/registry/radio-group/rtl.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const radioGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "radio-group-choice-card",
      title: "Choice Card",
      description: "Use FieldLabel to wrap the entire Field for a clickable card-style selection.",
      Demo: RadioGroupChoiceCard,
      source: docSource("radio-group", "choice-card"),
    },
    {
      id: "radio-group-description",
      title: "Description",
      description: "Radio group items with a description using the Field component.",
      Demo: RadioGroupDescription,
      source: docSource("radio-group", "description"),
    },
    {
      id: "radio-group-disabled",
      title: "Disabled",
      description: "Use the disabled prop on RadioGroupItem to disable individual items.",
      Demo: RadioGroupDisabled,
      source: docSource("radio-group", "disabled"),
    },
    {
      id: "radio-group-fieldset",
      title: "Fieldset",
      description: "Use FieldSet and FieldLegend to group radio items with a label and description.",
      Demo: RadioGroupFieldset,
      source: docSource("radio-group", "fieldset"),
    },
    {
      id: "radio-group-invalid",
      title: "Invalid",
      description: "Use aria-invalid on RadioGroupItem and data-invalid on Field to show validation errors.",
      Demo: RadioGroupInvalid,
      source: docSource("radio-group", "invalid"),
    },
    {
      id: "radio-group-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: RadioGroupRtl,
      source: docSource("radio-group", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "RadioGroup", children: [{ name: "RadioGroupItem" }] }],
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
