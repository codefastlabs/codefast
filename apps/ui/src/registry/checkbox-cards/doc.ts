import { CheckboxCardsColumns } from "#/registry/checkbox-cards/columns.example";
import { CheckboxCardsDisabled } from "#/registry/checkbox-cards/disabled.example";
import { CheckboxCardsFeatures } from "#/registry/checkbox-cards/features.example";
import { docSource, docUsage } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const checkboxCardsDoc: ComponentDoc = {
  usage: docUsage("checkbox-cards"),
  examples: [
    {
      id: "features",
      title: "Multi-select cards",
      description: "Card-style multi-select with highlighted state and a live list of choices.",
      Demo: CheckboxCardsFeatures,
      source: docSource("checkbox-cards", "features"),
      previewClassName: "items-start",
    },
    {
      id: "columns",
      title: "Two columns",
      description: "Lay cards out in a grid for compact add-on pickers.",
      Demo: CheckboxCardsColumns,
      source: docSource("checkbox-cards", "columns"),
    },
    {
      id: "disabled",
      title: "Disabled option",
      description: "Mark an option unavailable while keeping it visible.",
      Demo: CheckboxCardsDisabled,
      source: docSource("checkbox-cards", "disabled"),
      previewClassName: "items-start",
    },
  ],
  anatomy: [{ name: "CheckboxCards", children: [{ name: "CheckboxCardsItem" }] }],
  features: [
    "Each CheckboxCardsItem already renders its own Label wrapping the checkbox and its children — the whole card is clickable, no separate <Label htmlFor> needed.",
    "Built on the same multi-select headless primitive as Checkbox Group, styled as selectable cards sharing one value array.",
  ],
  api: [
    {
      name: "CheckboxCards",
      description: "A multi-selection group of cards sharing one value array.",
      props: [
        {
          name: "value / onValueChange",
          type: "string[] / (value: string[]) => void",
          description: "Controlled list of selected card values.",
        },
        {
          name: "defaultValue",
          type: "string[]",
          description: "Initial selection when uncontrolled.",
        },
      ],
    },
    {
      name: "CheckboxCardsItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "Added to the array when the card is selected (required).",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Makes a single card non-selectable.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves between cards." },
      { keys: ["Space"], description: "Toggles the focused card." },
    ],
    notes: [
      "Each card is a checkbox with its own aria-checked.",
      "The whole card is the hit target, not just a small box.",
      "Keep card content concise so the selected state reads clearly.",
    ],
  },
  guidelines: {
    do: ["Use for picking several rich options (features, add-ons).", "Show a short description on each card."],
    dont: ["Don’t use for single-select — that’s Radio Cards.", "Don’t put multiple actions inside a card."],
  },
  related: ["checkbox-group", "radio-cards", "checkbox"],
};
