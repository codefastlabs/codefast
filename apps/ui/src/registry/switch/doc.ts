import { docSource, docUsage } from "#/registry/source";
import { SwitchChoiceCard } from "#/registry/switch/choice-card.example";
import { SwitchDescription } from "#/registry/switch/description.example";
import { SwitchDisabled } from "#/registry/switch/disabled.example";
import { SwitchInvalid } from "#/registry/switch/invalid.example";
import { SwitchRtl } from "#/registry/switch/rtl.example";
import { SwitchSizes } from "#/registry/switch/sizes.example";
import type { ComponentDoc } from "#/registry/types";

export const switchDoc: ComponentDoc = {
  usage: docUsage("switch"),
  examples: [
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
    {
      id: "switch-choice-card",
      title: "Choice Card",
      description: "Card-style selection where FieldLabel wraps the entire Field for a clickable card pattern.",
      Demo: SwitchChoiceCard,
      source: docSource("switch", "choice-card"),
    },
    {
      id: "switch-description",
      title: "Description",
      description: "A control that allows the user to toggle between checked and not checked.",
      Demo: SwitchDescription,
      source: docSource("switch", "description"),
    },
    {
      id: "switch-invalid",
      title: "Invalid",
      description:
        "Add the aria-invalid prop to the Switch component to indicate an invalid state. Add the data-invalid prop to the Field component for styling.",
      Demo: SwitchInvalid,
      source: docSource("switch", "invalid"),
    },
    {
      id: "switch-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: SwitchRtl,
      source: docSource("switch", "rtl"),
      direction: "rtl",
    },
  ],
  anatomy: [{ name: "Switch" }],
  features: [
    "Two sizes (default, sm) with a matching thumb size.",
    'RTL-aware out of the box — the thumb translates the correct direction under dir="rtl" with no extra config.',
    'Built on Radix Switch; exposes role="switch" with a live aria-checked.',
  ],
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
