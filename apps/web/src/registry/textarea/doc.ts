import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { TextareaButton } from "#/registry/textarea/button.example";
import { TextareaDisabled } from "#/registry/textarea/disabled.example";
import { TextareaField } from "#/registry/textarea/field.example";
import { TextareaInvalid } from "#/registry/textarea/invalid.example";
import { TextareaRtl } from "#/registry/textarea/rtl.example";

export const textareaDoc: ComponentDoc = {
  usage: docUsage("textarea"),
  examples: [
    {
      id: "textarea-button",
      title: "Button",
      description: "Pair with Button to create a textarea with a submit button.",
      Demo: TextareaButton,
      source: docSource("textarea", "button"),
    },
    {
      id: "textarea-disabled",
      title: "Disabled",
      description:
        "Use the disabled prop to disable the textarea. To style the disabled state, add the data-disabled attribute to the Field component.",
      Demo: TextareaDisabled,
      source: docSource("textarea", "disabled"),
    },
    {
      id: "textarea-field",
      title: "Field",
      description: "Use Field, FieldLabel, and FieldDescription to create a textarea with a label and description.",
      Demo: TextareaField,
      source: docSource("textarea", "field"),
    },
    {
      id: "textarea-invalid",
      title: "Invalid",
      description:
        "Use the aria-invalid prop to mark the textarea as invalid. To style the invalid state, add the data-invalid attribute to the Field component.",
      Demo: TextareaInvalid,
      source: docSource("textarea", "invalid"),
    },
    {
      id: "textarea-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: TextareaRtl,
      source: docSource("textarea", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "Textarea" }],
  features: [
    "Auto-grows to fit its content via the native field-sizing: content CSS property — no resize-observer JS needed.",
    "Forwards every native <textarea> prop (rows, maxLength, controlled value/onChange).",
    "Composes with Field/FieldLabel/FieldDescription for a labelled field, and with Button for a submit-style composer.",
  ],
  api: [
    {
      name: "Textarea",
      description: "A multiline text input. Forwards all native textarea props.",
      props: [
        {
          name: "rows",
          type: "number",
          description: "Initial visible height in lines.",
        },
        {
          name: "maxLength",
          type: "number",
          description: "Hard cap on the number of characters.",
        },
        {
          name: "value",
          type: "string",
          description: "The controlled value.",
        },
        {
          name: "onChange",
          type: "React.ChangeEventHandler<HTMLTextAreaElement>",
          description: "Called when the value changes.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Always pair with a Label via htmlFor / id.",
      "If you show a counter, also enforce the limit with maxLength.",
      "Use aria-describedby to link helper or error text.",
    ],
  },
  guidelines: {
    do: ["Use for free-form, multi-line input like notes and bios.", "Show a counter when there’s a length limit."],
    dont: [
      "Don’t use a textarea for single-line input — use Input.",
      "Don’t disable resize unless the layout truly requires it.",
    ],
  },
  related: ["input", "field", "label"],
};
