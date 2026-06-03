import type { ComponentDoc } from "#/components/examples/docs/types";
import {
  switchAnatomyCode,
  switchDisabledCode,
  switchSizesCode,
  switchWithLabelCode,
} from "#/components/examples/codes";
import { SwitchDisabled } from "#/components/examples/docs/switch/disabled";
import { SwitchSizes } from "#/components/examples/docs/switch/sizes";
import { SwitchWithLabel } from "#/components/examples/docs/switch/with-label";

export const switchDoc: ComponentDoc = {
  examples: [
    {
      id: "with-label",
      title: "With label",
      description: "Controlled via checked + onCheckedChange, paired with a Label.",
      Demo: SwitchWithLabel,
      code: switchWithLabelCode,
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "Two sizes: sm and the default.",
      Demo: SwitchSizes,
      code: switchSizesCode,
    },
    {
      id: "disabled",
      title: "Disabled",
      description: "Non-interactive in both the on and off positions.",
      Demo: SwitchDisabled,
      code: switchDisabledCode,
    },
  ],
  anatomy: switchAnatomyCode,
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
