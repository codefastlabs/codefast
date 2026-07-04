import { InputPasswordConfirm } from "#/registry/input-password/confirm.example";
import { InputPasswordFields } from "#/registry/input-password/fields.example";
import { InputPasswordStrength } from "#/registry/input-password/strength.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const inputPasswordDoc: ComponentDoc = {
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
      "The reveal button is labelled and toggles aria-pressed for assistive tech.",
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
