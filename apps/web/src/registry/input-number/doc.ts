import { InputNumberFormats } from "#/registry/input-number/formats.example";
import { InputNumberQuantity } from "#/registry/input-number/quantity.example";
import { InputNumberStates } from "#/registry/input-number/states.example";
import { docSource, docAnatomy } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const inputNumberDoc: ComponentDoc = {
  examples: [
    {
      id: "quantity",
      title: "Stepper with bounds",
      description: "Increment/decrement controls plus min, max, and step keep input valid.",
      Demo: InputNumberQuantity,
      source: docSource("input-number", "quantity"),
      previewClassName: "items-start",
    },
    {
      id: "formats",
      title: "Formats & variants",
      description: "Format as currency with Intl options, or use the split stepper layout.",
      Demo: InputNumberFormats,
      source: docSource("input-number", "formats"),
      previewClassName: "items-start",
    },
    {
      id: "states",
      title: "Disabled & invalid",
      description: "Native disabled plus aria-invalid styling.",
      Demo: InputNumberStates,
      source: docSource("input-number", "states"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("input-number"),
  api: [
    {
      name: "InputNumber",
      description: "A numeric field with steppers, bounds, and locale-aware formatting.",
      props: [
        {
          name: "value / onChange",
          type: "number / (value: number) => void",
          description: "Controlled value and its handler. Or use defaultValue uncontrolled.",
        },
        {
          name: "min / max / step",
          type: "number",
          description: "Bounds and increment. Values are clamped to the range.",
        },
        {
          name: "formatOptions",
          type: "Intl.NumberFormatOptions",
          description: 'Format the display, e.g. { style: "currency", currency: "USD" }.',
        },
        {
          name: "variant",
          type: '"stepper" | "split"',
          default: '"stepper"',
          description: "Inline steppers, or − and + on either side.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Arrow", "Up"], description: "Increments by one step." },
      { keys: ["Arrow", "Down"], description: "Decrements by one step." },
    ],
    notes: [
      "Renders a spinbutton with aria-valuenow / valuemin / valuemax.",
      "Pair with a Label so the field has an accessible name.",
      "Formatting is display-only — the underlying value stays numeric.",
    ],
  },
  guidelines: {
    do: ["Set min, max, and step to express the valid range.", "Use formatOptions for currency, percent, and units."],
    dont: ["Don’t use it for codes or phone numbers — use Input.", "Don’t omit a label."],
  },
  related: ["input", "slider", "field"],
};
