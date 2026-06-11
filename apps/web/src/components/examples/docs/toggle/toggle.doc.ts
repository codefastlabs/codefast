import { docSource, docAnatomy } from "#/components/examples/docs/source";
import { TogglePin } from "#/components/examples/docs/toggle/pin";
import { ToggleSizes } from "#/components/examples/docs/toggle/sizes";
import { ToggleToolbar } from "#/components/examples/docs/toggle/toolbar";
import type { ComponentDoc } from "#/components/examples/docs/types";

export const toggleDoc: ComponentDoc = {
  examples: [
    {
      id: "toolbar",
      title: "Icon toggles",
      description: "Independent on/off buttons — each keeps its own pressed state.",
      Demo: ToggleToolbar,
      source: docSource("toggle", "toolbar"),
    },
    {
      id: "controlled",
      title: "Controlled with label",
      description: "Drive the pressed state yourself and swap the label to match.",
      Demo: TogglePin,
      source: docSource("toggle", "pin"),
    },
    {
      id: "sizes",
      title: "Sizes",
      description: "sm, default, and lg toggles.",
      Demo: ToggleSizes,
      source: docSource("toggle", "sizes"),
    },
  ],
  anatomy: docAnatomy("toggle"),
  api: [
    {
      name: "Toggle",
      description: "A two-state pressable button.",
      props: [
        {
          name: "pressed / onPressedChange",
          type: "boolean / (pressed: boolean) => void",
          description: "Controlled state and its handler.",
        },
        {
          name: "defaultPressed",
          type: "boolean",
          default: "false",
          description: "Initial state when uncontrolled.",
        },
        {
          name: "variant",
          type: '"default" | "outline"',
          default: '"default"',
          description: "Visual style.",
        },
        {
          name: "size",
          type: '"sm" | "default" | "lg"',
          default: '"default"',
          description: "Button size.",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus to the toggle." },
      { keys: ["Space"], description: "Flips the pressed state." },
      { keys: ["Enter"], description: "Flips the pressed state." },
    ],
    notes: [
      "Exposes aria-pressed so the on/off state is announced.",
      "Icon-only toggles must set an aria-label.",
      "Use a Switch instead for a setting that reads as on/off rather than pressed.",
    ],
  },
  guidelines: {
    do: ["Use for a single independent on/off, like a formatting mark.", "Group related toggles with Toggle Group."],
    dont: ["Don’t use a Toggle where a Switch or Checkbox fits better.", "Don’t leave icon toggles unlabelled."],
  },
  related: ["toggle-group", "switch", "button"],
};
