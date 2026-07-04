import { CheckboxBasic } from "#/registry/checkbox/basic.example";
import { CheckboxDescription } from "#/registry/checkbox/description.example";
import { CheckboxDisabled } from "#/registry/checkbox/disabled.example";
import { CheckboxGroup } from "#/registry/checkbox/group.example";
import { CheckboxIndeterminate } from "#/registry/checkbox/indeterminate.example";
import { CheckboxInvalid } from "#/registry/checkbox/invalid.example";
import { CheckboxRtl } from "#/registry/checkbox/rtl.example";
import { CheckboxInTable } from "#/registry/checkbox/table.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const checkboxDoc: ComponentDoc = {
  examples: [
    {
      id: "checkbox-basic",
      title: "Basic",
      description: "Pair the checkbox with Field and FieldLabel for proper layout and labeling.",
      Demo: CheckboxBasic,
      source: docSource("checkbox", "basic"),
    },
    {
      id: "checkbox-description",
      title: "Description",
      description: "Use FieldContent and FieldDescription for helper text.",
      Demo: CheckboxDescription,
      source: docSource("checkbox", "description"),
    },
    {
      id: "checkbox-disabled",
      title: "Disabled",
      description:
        "Use the disabled prop to prevent interaction and add the data-disabled attribute to the <Field> component for disabled styles.",
      Demo: CheckboxDisabled,
      source: docSource("checkbox", "disabled"),
    },
    {
      id: "checkbox-group",
      title: "Group",
      description: "Group related checkboxes inside a FieldSet with a FieldLegend and shared description.",
      Demo: CheckboxGroup,
      source: docSource("checkbox", "group"),
    },
    {
      id: "checkbox-indeterminate",
      title: "Indeterminate",
      description:
        'Pass checked="indeterminate" to a parent that controls a list when only some children are selected.',
      Demo: CheckboxIndeterminate,
      source: docSource("checkbox", "indeterminate"),
    },
    {
      id: "checkbox-invalid",
      title: "Invalid State",
      description: "Use aria-invalid to style the checkbox in an invalid state.",
      Demo: CheckboxInvalid,
      source: docSource("checkbox", "invalid"),
    },
    {
      id: "checkbox-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: CheckboxRtl,
      source: docSource("checkbox", "rtl"),
      direction: "rtl",
    },
    {
      id: "checkbox-table",
      title: "Table",
      description: "A control that allows the user to toggle between checked and not checked.",
      Demo: CheckboxInTable,
      source: docSource("checkbox", "table"),
    },
  ],
  anatomy: [{ name: "Checkbox" }],
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
