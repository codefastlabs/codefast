import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { FieldCheckbox } from "#/registry/field/checkbox.example";
import { FieldChoiceCard } from "#/registry/field/choice-card.example";
import { FieldFieldset } from "#/registry/field/fieldset.example";
import { FieldGroupExample } from "#/registry/field/group.example";
import { FieldInput } from "#/registry/field/input.example";
import { FieldRadio } from "#/registry/field/radio.example";
import { FieldResponsive } from "#/registry/field/responsive.example";
import { FieldRtl } from "#/registry/field/rtl.example";
import { FieldSelect } from "#/registry/field/select.example";
import { FieldSlider } from "#/registry/field/slider.example";
import { FieldSwitch } from "#/registry/field/switch.example";
import { FieldTextarea } from "#/registry/field/textarea.example";

export const fieldDoc: ComponentDoc = {
  usage: docUsage("field"),
  examples: [
    {
      id: "field-checkbox",
      title: "Checkbox",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldCheckbox,
      source: docSource("field", "checkbox"),
    },
    {
      id: "field-choice-card",
      title: "Choice Card",
      description:
        "Wrap Field components inside FieldLabel to create selectable field groups. This works with RadioItem, Checkbox and Switch components.",
      Demo: FieldChoiceCard,
      source: docSource("field", "choice-card"),
    },
    {
      id: "field-fieldset",
      title: "Fieldset",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldFieldset,
      source: docSource("field", "fieldset"),
    },
    {
      id: "field-group",
      title: "Field Group",
      description: "Stack Field components with FieldGroup. Add FieldSeparator to divide them.",
      Demo: FieldGroupExample,
      source: docSource("field", "group"),
    },
    {
      id: "field-input",
      title: "Input",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldInput,
      source: docSource("field", "input"),
    },
    {
      id: "field-radio",
      title: "Radio",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldRadio,
      source: docSource("field", "radio"),
    },
    {
      id: "field-responsive",
      title: "Responsive Layout",
      description: "Field layouts adapt responsively to their container.",
      Demo: FieldResponsive,
      source: docSource("field", "responsive"),
    },
    {
      id: "field-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: FieldRtl,
      source: docSource("field", "rtl"),
      direction: "rtl",
    },
    {
      id: "field-select",
      title: "Select",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldSelect,
      source: docSource("field", "select"),
    },
    {
      id: "field-slider",
      title: "Slider",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldSlider,
      source: docSource("field", "slider"),
    },
    {
      id: "field-switch",
      title: "Switch",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldSwitch,
      source: docSource("field", "switch"),
    },
    {
      id: "field-textarea",
      title: "Textarea",
      description: "Combine labels, controls, and help text to compose accessible form fields and grouped inputs.",
      Demo: FieldTextarea,
      source: docSource("field", "textarea"),
    },
  ],
  anatomy: [
    { name: "Field", children: [{ name: "FieldLabel" }, { name: "FieldDescription" }, { name: "FieldError" }] },
  ],
  features: [
    "FieldError dedupes repeated error messages and renders a single line or a bullet list automatically — pass an array of { message } straight from a validation library.",
    "Wrapping an entire Field inside FieldLabel turns it into a clickable choice-card — no extra markup needed, the has-data-checked: styling kicks in on its own.",
    'FieldSeparator draws a divider with an optional centered label, e.g. "OR".',
    'orientation="horizontal" lays the control beside the label instead of underneath.',
  ],
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
      name: "FieldLabel",
      description: "Accessible label for the field's control.",
      props: [
        {
          name: "htmlFor",
          type: "string",
          description: "Points at the control id for an accessible name.",
        },
      ],
    },
    {
      name: "FieldDescription",
      description: "Supporting help text under the label.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The supporting copy.",
        },
      ],
    },
    {
      name: "FieldError",
      description: "Validation message, rendered conditionally when the field is invalid.",
      props: [
        {
          name: "errors",
          type: "Array<{ message?: string } | undefined>",
          description:
            "Validation errors straight from a form library — deduped and rendered as one line, or a bullet list when there’s more than one.",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "Custom error content — takes priority over errors when provided.",
        },
      ],
    },
    {
      name: "FieldSet",
      description: "Groups several related fields, like a native fieldset.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "FieldLegend plus the grouped Field or FieldGroup elements.",
        },
      ],
    },
    {
      name: "FieldLegend",
      description: "Titles a FieldSet.",
      props: [
        {
          name: "variant",
          type: '"legend" | "label"',
          default: '"legend"',
          description: 'Size the legend like a section title, or "label" for a smaller, label-sized heading.',
        },
        {
          name: "children",
          type: "ReactNode",
          description: "The legend text.",
        },
      ],
    },
    {
      name: "FieldGroup",
      description: "Spaces a set of Field elements evenly.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "The Field (or nested FieldGroup) elements to space out.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "FieldLabel forwards htmlFor — always link it to the control’s id.",
      "Set aria-invalid on the control and render FieldError so the error is announced.",
      'FieldError sets role="alert", so screen readers announce it as soon as it mounts — no extra wiring needed.',
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
