import { FieldLayouts } from "#/components/examples/field.layouts.example";
import { FieldValidation } from "#/components/examples/field.validation.example";
import { FieldWithSelect } from "#/components/examples/field.with-select.example";
import { docSource, docAnatomy } from "#/components/examples/source";
import type { ComponentDoc } from "#/components/examples/types";

export const fieldDoc: ComponentDoc = {
  examples: [
    {
      id: "validation",
      title: "Live validation",
      description: "A real form: submit with an invalid email to see FieldError and the error ring appear.",
      Demo: FieldValidation,
      source: docSource("field", "validation"),
      previewClassName: "items-start",
    },
    {
      id: "layouts",
      title: "Layouts & groups",
      description: "Vertical and horizontal orientation, plus FieldSet + FieldLegend to group related fields.",
      Demo: FieldLayouts,
      source: docSource("field", "layouts"),
      previewClassName: "items-start",
    },
    {
      id: "with-select",
      title: "Wrapping a select",
      description: "Field works with any control, not just inputs.",
      Demo: FieldWithSelect,
      source: docSource("field", "with-select"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("field"),
  api: [
    {
      name: "Field",
      description: "Vertical wrapper that lays out a label, control, description, and error.",
      props: [
        {
          name: "orientation",
          type: '"vertical" | "horizontal"',
          default: '"vertical"',
          description: "Stack the control under the label, or beside it.",
        },
      ],
    },
    {
      name: "FieldLabel / FieldDescription / FieldError",
      description: "The text parts. Render FieldError conditionally when the field is invalid.",
      props: [
        {
          name: "htmlFor",
          type: "string",
          description: "On FieldLabel, points at the control id for an accessible name.",
        },
      ],
    },
    {
      name: "FieldSet / FieldLegend / FieldGroup",
      description: "Group several related fields under a legend.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "FieldLegend titles the set; FieldGroup spaces fields evenly.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "FieldLabel forwards htmlFor — always link it to the control’s id.",
      "Set aria-invalid on the control and render FieldError so the error is announced.",
      "Use FieldSet + FieldLegend for groups of checkboxes or radios.",
    ],
  },
  guidelines: {
    do: [
      "Pair every control with a FieldLabel.",
      "Show errors next to the field, on submit or on blur — not only as a toast.",
    ],
    dont: ["Don’t rely on the red ring alone — always give a text error.", "Don’t use placeholder text as the label."],
  },
  related: ["form", "input", "label", "checkbox"],
};
