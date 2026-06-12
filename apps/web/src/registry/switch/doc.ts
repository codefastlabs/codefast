import { docSource, docAnatomy } from "#/registry/source";
import { SwitchDisabled } from "#/registry/switch/disabled.example";
import { SwitchSizes } from "#/registry/switch/sizes.example";
import { SwitchWithLabel } from "#/registry/switch/with-label.example";
import type { ComponentDoc } from "#/registry/types";

export const switchDoc: ComponentDoc = {
  examples: [
    {
      id: "with-label",
      title: "With label",
      description: "Controlled via checked + onCheckedChange, paired with a Label.",
      Demo: SwitchWithLabel,
      source: docSource("switch", "with-label"),
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "Two sizes: sm and the default.",
      Demo: SwitchSizes,
      source: docSource("switch", "sizes"),
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "Non-interactive in both the on and off positions.",
      Demo: SwitchDisabled,
      source: docSource("switch", "disabled"),
    },
  ],
  anatomy: docAnatomy("switch"),
  api: [
    {
      name: "Switch",
      description: "A toggle built on Radix Switch.",
      props: [
        {
          name: "checked / onCheckedChange",
          type: "boolean / (checked: boolean) => void",
          description: "Controlled state and its change handler.",
        },
        {
          name: "defaultChecked",
          type: "boolean",
          default: "false",
          description: "Initial state when uncontrolled.",
        },
        {
          name: "size",
          type: '"default" | "sm"',
          default: '"default"',
          description: "Track and thumb size.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Blocks interaction and dims the control.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to the switch." },
      { keys: ["Space"], description: "Toggles the switch." },
      { keys: ["Enter"], description: "Toggles the switch." },
    ],
    notes: [
      "Has role=switch with aria-checked reflecting the current state.",
      "Associate a Label via htmlFor / id, or wrap the control, so it has a name.",
      "Use a Checkbox instead when the change should only apply after a form submit.",
    ],
  },
  guidelines: {
    do: [
      "Use for settings that take effect immediately.",
      "Make the label describe the on state (e.g. “Email notifications”).",
    ],
    dont: [
      "Don’t use a switch where a Checkbox (deferred submit) is expected.",
      "Don’t require a separate Save button for a switch that applies instantly.",
    ],
  },
  related: ["checkbox", "toggle", "radio-group"],
};
