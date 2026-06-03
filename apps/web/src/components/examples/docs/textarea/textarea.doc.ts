import type { ComponentDoc } from "#/components/examples/docs/types";
import { textareaAnatomyCode, textareaCounterCode } from "#/components/examples/codes";
import { TextareaCounter } from "#/components/examples/docs/textarea/counter";

export const textareaDoc: ComponentDoc = {
  examples: [
    {
      id: "counter",
      title: "With character counter",
      description: "Controlled value plus maxLength drives a live remaining-characters count.",
      Demo: TextareaCounter,
      code: textareaCounterCode,
      previewClassName: "items-start",
    },
  ],
  anatomy: textareaAnatomyCode,
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
          name: "value / onChange",
          type: "string / (event) => void",
          description: "Standard controlled textarea props.",
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
    do: [
      "Use for free-form, multi-line input like notes and bios.",
      "Show a counter when there’s a length limit.",
    ],
    dont: [
      "Don’t use a textarea for single-line input — use Input.",
      "Don’t disable resize unless the layout truly requires it.",
    ],
  },
  related: ["input", "field", "label"],
};
