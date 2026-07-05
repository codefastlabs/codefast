import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { InputPasswordConfirm } from "#/registry/input-password/confirm.example";
import { InputPasswordFields } from "#/registry/input-password/fields.example";
import { InputPasswordStrength } from "#/registry/input-password/strength.example";

export const inputPasswordDoc: ComponentDoc = {
  usage: docUsage("input-password"),
  examples: [
    {
      id: "fields",
      title: "Show / hide toggle",
      description: "A built-in eye button reveals the value — no extra markup needed.",
      Demo: InputPasswordFields,
      source: docSource("input-password", "fields"),
      previewClassName: "items-start",
    },
    {
      id: "strength",
      title: "Live strength meter",
      description: "Drive a strength bar from the controlled value as the user types.",
      Demo: InputPasswordStrength,
      source: docSource("input-password", "strength"),
      previewClassName: "items-start",
    },
    {
      id: "confirm",
      title: "Confirm match",
      description: "Two fields with a live match check.",
      Demo: InputPasswordConfirm,
      source: docSource("input-password", "confirm"),
      previewClassName: "items-start",
    },
  ],
  anatomy: [{ name: "InputPassword" }],
  features: [
    "Built-in show/hide toggle — internally an InputGroupInput plus an InputGroupButton, no extra markup needed.",
    'The toggle’s aria-label swaps between "Show password" and "Hide password" as it’s clicked; it does not set aria-pressed.',
    "Forwards every native input prop except type, which the component manages internally.",
  ],
  api: [
    {
      name: "InputPassword",
      description: "Extends Input with a reveal toggle. Forwards all native input props.",
      props: [
        {
          name: "value / onChange",
          type: "string / (event) => void",
          description: "Standard controlled input props.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the field and the toggle.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      'The reveal button relabels itself ("Show password" / "Hide password") as it toggles — that changing label, not aria-pressed, is what gets announced.',
      "Set autoComplete (current-password / new-password) to help password managers.",
      "Associate a Label via htmlFor / id.",
    ],
  },
  guidelines: {
    do: [
      "Offer the reveal toggle so users can check what they typed.",
      "Show password requirements and live feedback on sign-up.",
    ],
    dont: ["Don’t block paste — it breaks password managers.", "Don’t impose arbitrary maximum lengths."],
  },
  related: ["input", "input-group", "field"],
};
