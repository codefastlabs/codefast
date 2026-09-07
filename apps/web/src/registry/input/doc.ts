import { docSource } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { InputBadge } from "#/registry/input/badge.example";
import { InputBasic } from "#/registry/input/basic.example";
import { InputButtonGroup } from "#/registry/input/button-group.example";
import { InputDisabled } from "#/registry/input/disabled.example";
import { InputField } from "#/registry/input/field.example";
import { InputFieldgroup } from "#/registry/input/fieldgroup.example";
import { InputFile } from "#/registry/input/file.example";
import { InputForm } from "#/registry/input/form.example";
import { InputGrid } from "#/registry/input/grid.example";
import { InputInline } from "#/registry/input/inline.example";
import { InputInputGroup } from "#/registry/input/input-group.example";
import { InputInvalid } from "#/registry/input/invalid.example";
import { InputRequired } from "#/registry/input/required.example";
import { InputRtl } from "#/registry/input/rtl.example";

export const inputDoc: ComponentDoc = {
  examples: [
    {
      id: "file",
      title: "File input",
      description: 'type="file" is styled to match the rest of the form controls.',
      Demo: InputFile,
      source: docSource("input", "file"),
    },
    {
      id: "input-badge",
      title: "Badge",
      description: "Use Badge in the label to highlight a recommended field.",
      Demo: InputBadge,
      source: docSource("input", "badge"),
    },
    {
      id: "input-basic",
      title: "Basic",
      description:
        "A text input component for forms and user data entry with built-in styling and accessibility features.",
      Demo: InputBasic,
      source: docSource("input", "basic"),
    },
    {
      id: "input-button-group",
      title: "Button Group",
      description:
        "To add buttons to an input, use the ButtonGroup component. See the Button Group component for more examples.",
      Demo: InputButtonGroup,
      source: docSource("input", "button-group"),
    },
    {
      id: "input-disabled",
      title: "Disabled",
      description:
        "Use the disabled prop to disable the input. To style the disabled state, add the data-disabled attribute to the Field component.",
      Demo: InputDisabled,
      source: docSource("input", "disabled"),
    },
    {
      id: "input-field",
      title: "Field",
      description: "Use Field, FieldLabel, and FieldDescription to create an input with a label and description.",
      Demo: InputField,
      source: docSource("input", "field"),
    },
    {
      id: "input-fieldgroup",
      title: "Field Group",
      description: "Use FieldGroup to show multiple Field blocks and to build forms.",
      Demo: InputFieldgroup,
      source: docSource("input", "fieldgroup"),
    },
    {
      id: "input-form",
      title: "Form",
      description: "A full form example with multiple inputs, a select, and a button.",
      Demo: InputForm,
      source: docSource("input", "form"),
    },
    {
      id: "input-grid",
      title: "Grid",
      description: "Use a grid layout to place multiple inputs side by side.",
      Demo: InputGrid,
      source: docSource("input", "grid"),
    },
    {
      id: "input-inline",
      title: "Inline",
      description:
        "Use Field with orientation='horizontal' to create an inline input. Pair with Button to create a search input with a button.",
      Demo: InputInline,
      source: docSource("input", "inline"),
    },
    {
      id: "input-input-group",
      title: "Input Group",
      description:
        "To add icons, text, or buttons inside an input, use the InputGroup component. See the Input Group component for more examples.",
      Demo: InputInputGroup,
      source: docSource("input", "input-group"),
    },
    {
      id: "input-invalid",
      title: "Invalid",
      description:
        "Use the aria-invalid prop to mark the input as invalid. To style the invalid state, add the data-invalid attribute to the Field component.",
      Demo: InputInvalid,
      source: docSource("input", "invalid"),
    },
    {
      id: "input-required",
      title: "Required",
      description: "Use the required attribute to indicate required inputs.",
      Demo: InputRequired,
      source: docSource("input", "required"),
    },
    {
      id: "input-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: InputRtl,
      source: docSource("input", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "Input" }],
  features: [
    'Forwards every native <input> prop and type (text, email, password, number, …), with type="file" getting dedicated styling.',
    "Built-in invalid (aria-invalid) and disabled states, styled without extra classes.",
    "Composes with Field/FieldGroup for a labelled field, InputGroup for icons or buttons inside the field, and ButtonGroup for adjacent action buttons.",
  ],
  api: [
    {
      name: "Input",
      description: "Renders a native <input>; forwards every native input prop.",
      props: [
        {
          name: "type",
          type: '"text" | "email" | "password" | "file" | "number" | …',
          default: '"text"',
          description: "Native input type. file gets dedicated styling.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Dims the field and blocks interaction.",
        },
        {
          name: "aria-invalid",
          type: "boolean",
          default: "false",
          description: "Switches the field to the destructive error ring.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [{ keys: ["Tab"], description: "Moves focus to and from the input." }],
    notes: [
      "Always associate a Label via htmlFor / id so the field has an accessible name.",
      "Use aria-invalid plus a visible error message — colour alone is not sufficient.",
      "Describe the field with aria-describedby when you show helper or error text.",
    ],
  },
  guidelines: {
    do: ["Give every input a visible label.", "Use the correct type so mobile keyboards and autofill behave well."],
    dont: [
      "Don’t use placeholder text as a replacement for a label.",
      "Don’t disable a field when a read-only state would communicate intent better.",
    ],
  },
  related: ["input-group", "input-password", "textarea", "field"],
};
