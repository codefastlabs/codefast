import { docSource, docAnatomy } from "#/registry/source";
import { TextareaCounter } from "#/registry/textarea/counter.example";
import { TextareaRows } from "#/registry/textarea/rows.example";
import { TextareaStates } from "#/registry/textarea/states.example";
import type { ComponentDoc } from "#/registry/types";

export const textareaDoc: ComponentDoc = {
  examples: [
    {
      id: "counter",
      title: "With character counter",
      description: "Controlled value plus maxLength drives a live remaining-characters count.",
      Demo: TextareaCounter,
      source: docSource("textarea", "counter"),
      previewClassName: "items-start",
    },
    {
      id: "states",
      title: "Disabled & invalid",
      description: "Built-in disabled and aria-invalid styling.",
      Demo: TextareaStates,
      source: docSource("textarea", "states"),
      previewClassName: "items-start",
    },
    {
      id: "rows",
      title: "Row heights",
      description: "Set the initial height with the rows attribute.",
      Demo: TextareaRows,
      source: docSource("textarea", "rows"),
      previewClassName: "items-start",
    },
  ],
  anatomy: docAnatomy("textarea"),
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
    do: ["Use for free-form, multi-line input like notes and bios.", "Show a counter when there’s a length limit."],
    dont: [
      "Don’t use a textarea for single-line input — use Input.",
      "Don’t disable resize unless the layout truly requires it.",
    ],
  },
  related: ["input", "field", "label"],
};
