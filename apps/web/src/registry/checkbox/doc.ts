import { CheckboxSelectAll } from "#/registry/checkbox/select-all.example";
import { CheckboxStates } from "#/registry/checkbox/states.example";
import { CheckboxWithDescription } from "#/registry/checkbox/with-description.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const checkboxDoc: ComponentDoc = {
  examples: [
    {
      id: "select-all",
      title: "Select-all (indeterminate)",
      description:
        "The classic parent/child pattern: the parent reflects an indeterminate state when only some children are checked.",
      Demo: CheckboxSelectAll,
      source: docSource("checkbox", "select-all"),
      previewClassName: "items-start",
    },
    {
      id: "with-description",
      title: "With description",
      description: "Pair a checkbox with a label and helper text for consent and settings rows.",
      Demo: CheckboxWithDescription,
      source: docSource("checkbox", "with-description"),
      previewClassName: "items-start",
    },
    {
      id: "states",
      title: "States",
      description: "Default, checked, and disabled combinations.",
      Demo: CheckboxStates,
      source: docSource("checkbox", "states"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("checkbox"),
  api: [
    {
      name: "Checkbox",
      description: "Built on Radix Checkbox.",
      props: [
        {
          name: "checked / onCheckedChange",
          type: 'boolean | "indeterminate" / (checked) => void',
          description: 'Controlled state. Pass "indeterminate" for a mixed parent.',
        },
        {
          name: "defaultChecked",
          type: "boolean",
          default: "false",
          description: "Initial state when uncontrolled.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Blocks interaction and dims the control.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to the checkbox." },
      { keys: ["Space"], description: "Toggles the checkbox." },
    ],
    notes: [
      'Has role=checkbox; the indeterminate state is exposed as aria-checked="mixed".',
      "Always associate a Label via htmlFor / id so the control has an accessible name.",
      "Use a Checkbox (not a Switch) when the change applies only after a form submit.",
    ],
  },
  guidelines: {
    do: [
      "Use the indeterminate state for a parent that controls a list.",
      "Let users click the label, not just the box, to toggle.",
    ],
    dont: [
      "Don’t use a single checkbox where a Switch better signals an instant setting.",
      "Don’t rely on the box alone — give it a clear, clickable label.",
    ],
  },
  related: ["checkbox-group", "switch", "radio-group"],
};
