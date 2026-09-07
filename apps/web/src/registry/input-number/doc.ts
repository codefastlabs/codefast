import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { InputNumberFormats } from "#/registry/input-number/formats.example";
import { InputNumberQuantity } from "#/registry/input-number/quantity.example";
import { InputNumberStates } from "#/registry/input-number/states.example";

export const inputNumberDoc: ComponentDoc = {
  usage: docUsage("input-number"),
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
      title: "Formats & layouts",
      description: "Format as currency with Intl options, or flank the field for a split layout.",
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
  anatomy: [
    {
      name: "InputNumber",
      children: [
        { name: "InputNumberField" },
        { name: "InputNumberStepper" },
        { name: "InputNumberDecrement" },
        { name: "InputNumberIncrement" },
      ],
    },
  ],
  features: [
    "Composable parts — pair InputNumberField with InputNumberStepper for the stacked layout, or flank it with InputNumberDecrement and InputNumberIncrement for a split layout. Layout follows child order.",
    "formatOptions (Intl.NumberFormatOptions) formats the displayed value, e.g. currency or percent, while the underlying value stays a plain number.",
    "min/max/step clamp both typed and stepper-driven changes to a valid range, and only the button facing a bound is disabled.",
    "Built-in loading/spinner support, e.g. while a computed value is being fetched.",
  ],
  api: [
    {
      name: "InputNumber",
      description:
        "The container that owns the numeric state, bounds, and formatting. Compose the parts below as children.",
      props: [
        {
          name: "value",
          type: "number",
          description: "The controlled numeric value. Or use defaultValue uncontrolled.",
        },
        {
          name: "onChange",
          type: "(value?: number) => void",
          description: "Called with the parsed number, or undefined when the field is cleared.",
        },
        {
          name: "min",
          type: "number",
          description: "The lower bound. Values are clamped to the range.",
        },
        {
          name: "max",
          type: "number",
          description: "The upper bound. Values are clamped to the range.",
        },
        {
          name: "step",
          type: "number",
          default: "1",
          description: "The increment applied by the steppers.",
        },
        {
          name: "formatOptions",
          type: "Intl.NumberFormatOptions",
          description: 'Format the display, e.g. { style: "currency", currency: "USD" }.',
        },
      ],
    },
    {
      name: "InputNumberField",
      description: "The editable spinbutton input.",
      props: [
        {
          name: "aria-invalid",
          type: "boolean",
          description: "Marks the field invalid and drives the container's invalid styling.",
        },
      ],
    },
    {
      name: "InputNumberStepper",
      description:
        "A stacked chevron column with both increment and decrement controls — the default layout. Place it after the field.",
      props: [
        {
          name: "className",
          type: "string",
          description: "Compose the column's styling.",
        },
      ],
    },
    {
      name: "InputNumberDecrement",
      description: "A standalone decrement button for the split layout. Place it before the field.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Override the default minus icon.",
        },
      ],
    },
    {
      name: "InputNumberIncrement",
      description: "A standalone increment button for the split layout. Place it after the field.",
      props: [
        {
          name: "children",
          type: "ReactNode",
          description: "Override the default plus icon.",
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
