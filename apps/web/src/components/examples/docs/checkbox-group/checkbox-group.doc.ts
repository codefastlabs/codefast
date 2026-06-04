import type { ComponentDoc } from "#/components/examples/docs/types";
import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { CheckboxGroupPermissions } from "#/components/examples/docs/checkbox-group/permissions";

export const checkboxGroupDoc: ComponentDoc = {
  examples: [
    {
      id: "permissions",
      title: "Controlled multi-select",
      description: "Several options share one value array; a disabled item is skipped.",
      Demo: CheckboxGroupPermissions,
      code: docSource("checkbox-group", "permissions"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("checkbox-group"),
  api: [
    {
      name: "CheckboxGroup",
      description: "A multi-selection group sharing one value array.",
      props: [
        {
          name: "value / onValueChange",
          type: "string[] / (value: string[]) => void",
          description: "Controlled list of checked values.",
        },
        {
          name: "defaultValue",
          type: "string[]",
          description: "Initial checked values when uncontrolled.",
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
      name: "CheckboxGroupItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "Added to the array when checked (required).",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Makes a single item non-selectable.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves between checkboxes." },
      { keys: ["Space"], description: "Toggles the focused item." },
    ],
    notes: [
      "Each item is a checkbox with its own aria-checked.",
      "Pair every item with a Label via matching id / htmlFor.",
      "Use this over loose checkboxes when they share one value.",
    ],
  },
  guidelines: {
    do: [
      "Use for choosing several options from a set (permissions, filters).",
      "Keep a disabled item visible to signal an unavailable option.",
    ],
    dont: ["Don’t use for one-of-many — use Radio Group.", "Don’t leave items unlabelled."],
  },
  related: ["checkbox", "checkbox-cards", "radio-group"],
};
