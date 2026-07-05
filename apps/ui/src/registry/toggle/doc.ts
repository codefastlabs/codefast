import { docSource, docUsage } from "#/registry/source";
import { ToggleDisabled } from "#/registry/toggle/disabled.example";
import { ToggleOutline } from "#/registry/toggle/outline.example";
import { ToggleRtl } from "#/registry/toggle/rtl.example";
import { ToggleSizes } from "#/registry/toggle/sizes.example";
import { ToggleText } from "#/registry/toggle/text.example";
import type { ComponentDoc } from "#/registry/types";

export const toggleDoc: ComponentDoc = {
  usage: docUsage("toggle"),
  examples: [
    {
      id: "sizes",
      title: "Sizes",
      description: "sm, default, and lg toggles.",
      Demo: ToggleSizes,
      source: docSource("toggle", "sizes"),
    },
    {
      id: "toggle-disabled",
      title: "Disabled",
      description: "A two-state button that can be either on or off.",
      Demo: ToggleDisabled,
      source: docSource("toggle", "disabled"),
    },
    {
      id: "toggle-outline",
      title: "Outline",
      description: "Use variant='outline' for an outline style.",
      Demo: ToggleOutline,
      source: docSource("toggle", "outline"),
    },
    {
      id: "toggle-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ToggleRtl,
      source: docSource("toggle", "rtl"),
      direction: "rtl",
    },
    {
      id: "toggle-text",
      title: "With Text",
      description: "A two-state button that can be either on or off.",
      Demo: ToggleText,
      source: docSource("toggle", "text"),
    },
  ],
  anatomy: [{ name: "Toggle" }],
  features: [
    "Two variants (default, outline) and three sizes (sm, default, lg).",
    "Exposes aria-pressed, reflecting pressed/defaultPressed, so assistive tech announces on/off state, not just the visual style.",
    "Group several toggles into one exclusive or multi-select cluster with Toggle Group.",
  ],
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
