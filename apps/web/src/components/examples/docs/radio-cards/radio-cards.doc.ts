import type { ComponentDoc } from "#/components/examples/docs/types";
import { radioCardsIntervalCode, radioCardsPlansCode } from "#/components/examples/codes";
import { RadioCardsInterval } from "#/components/examples/docs/radio-cards/interval";
import { RadioCardsPlans } from "#/components/examples/docs/radio-cards/plans";

export const radioCardsDoc: ComponentDoc = {
  examples: [
    {
      id: "plans",
      title: "Plan picker",
      description: "A controlled single-select with a highlighted card and a live readout.",
      Demo: RadioCardsPlans,
      code: radioCardsPlansCode,
      previewClassName: "items-start",
    },
    {
      id: "interval",
      title: "Billing interval",
      description: "Lay cards out in a grid; mix in a Badge to flag the better deal.",
      Demo: RadioCardsInterval,
      code: radioCardsIntervalCode,
    },
  ],
  anatomy: `import { RadioCards, RadioCardsItem } from "@codefast/ui/radio-cards";

<RadioCards value={v} onValueChange={setV}>
  <RadioCardsItem value="a">…</RadioCardsItem>
  <RadioCardsItem value="b">…</RadioCardsItem>
</RadioCards>`,
  api: [
    {
      name: "RadioCards",
      description: "Single-select group. Lay out children with grid/flex classes.",
      props: [
        {
          name: "value / onValueChange",
          type: "string / (value: string) => void",
          description: "Controlled selection and its handler.",
        },
        {
          name: "defaultValue",
          type: "string",
          description: "Initial selection when uncontrolled.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the whole group.",
        },
      ],
    },
    {
      name: "RadioCardsItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "Value selected when this card is chosen (required).",
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
      { keys: ["Tab"], description: "Moves focus into the group." },
      { keys: ["Arrow", "Down"], description: "Selects the next card." },
      { keys: ["Arrow", "Up"], description: "Selects the previous card." },
    ],
    notes: [
      "Built on the radio-group pattern — exactly one card is selected at a time.",
      "The whole card is the hit target, not just a small control.",
      "Keep card content concise so the selected state stays scannable.",
    ],
  },
  guidelines: {
    do: [
      "Use for picking one option from a small set of rich choices (plans, methods).",
      "Show price or key detail directly on each card.",
    ],
    dont: [
      "Don’t use for multi-select — that’s Checkbox Cards.",
      "Don’t overload a card with multiple actions.",
    ],
  },
  related: ["radio-group", "checkbox-cards", "card"],
};
