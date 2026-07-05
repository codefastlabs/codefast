import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { CheckboxGroupHorizontal } from "#/registry/checkbox-group/horizontal.example";
import { CheckboxGroupPermissions } from "#/registry/checkbox-group/permissions.example";
import { CheckboxGroupWithDescriptions } from "#/registry/checkbox-group/with-descriptions.example";

export const checkboxGroupDoc: ComponentDoc = {
  usage: docUsage("checkbox-group"),
  examples: [
    {
      id: "permissions",
      title: "Controlled multi-select",
      description: "Several options share one value array; a disabled item is skipped.",
      Demo: CheckboxGroupPermissions,
      source: docSource("checkbox-group", "permissions"),
      previewClassName: "items-start",
    },
    {
      id: "horizontal",
      title: "Horizontal layout",
      description: "Lay items out in a wrapping row.",
      Demo: CheckboxGroupHorizontal,
      source: docSource("checkbox-group", "horizontal"),
    },
    {
      id: "with-descriptions",
      title: "With descriptions",
      description: "Pair each option with a secondary hint.",
      Demo: CheckboxGroupWithDescriptions,
      source: docSource("checkbox-group", "with-descriptions"),
      previewClassName: "items-start",
    },
  ],
  anatomy: [{ name: "CheckboxGroup", children: [{ name: "CheckboxGroupItem" }] }],
  features: [
    "Not built on Radix — a hand-rolled headless primitive, since Radix has no multi-select checkbox-group primitive.",
    "Shares one value: string[] across every item — checking/unchecking updates array membership, not per-item state.",
    "Individual items can be disabled while the rest of the group stays interactive.",
  ],
  api: [
    {
      name: "CheckboxGroup",
      description: "A multi-selection group sharing one value array.",
      props: [
        {
          name: "value",
          type: "string[]",
          description: "The controlled list of checked values.",
        },
        {
          name: "defaultValue",
          type: "string[]",
          description: "The checked values when initially rendered (uncontrolled).",
        },
        {
          name: "onValueChange",
          type: "(value: string[]) => void",
          description: "Called when the checked values change.",
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
