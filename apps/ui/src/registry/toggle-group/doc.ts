import { docSource, docUsage } from "#/registry/_core/source";
import type { ComponentDoc } from "#/registry/_core/types";
import { ToggleGroupDisabled } from "#/registry/toggle-group/disabled.example";
import { ToggleGroupFontWeightSelector } from "#/registry/toggle-group/font-weight-selector.example";
import { ToggleGroupOutline } from "#/registry/toggle-group/outline.example";
import { ToggleGroupRtl } from "#/registry/toggle-group/rtl.example";
import { ToggleGroupSizes } from "#/registry/toggle-group/sizes.example";
import { ToggleGroupSpacing } from "#/registry/toggle-group/spacing.example";
import { ToggleGroupVertical } from "#/registry/toggle-group/vertical.example";

export const toggleGroupDoc: ComponentDoc = {
  usage: docUsage("toggle-group"),
  examples: [
    {
      id: "toggle-group-disabled",
      title: "Disabled",
      description: "A set of two-state buttons that can be toggled on or off.",
      Demo: ToggleGroupDisabled,
      source: docSource("toggle-group", "disabled"),
    },
    {
      id: "toggle-group-font-weight-selector",
      title: "Custom",
      description: "A custom toggle group example.",
      Demo: ToggleGroupFontWeightSelector,
      source: docSource("toggle-group", "font-weight-selector"),
    },
    {
      id: "toggle-group-outline",
      title: "Outline",
      description: "Use variant='outline' for an outline style.",
      Demo: ToggleGroupOutline,
      source: docSource("toggle-group", "outline"),
    },
    {
      id: "toggle-group-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ToggleGroupRtl,
      source: docSource("toggle-group", "rtl"),
      direction: "rtl",
    },
    {
      id: "toggle-group-sizes",
      title: "Size",
      description: "Use the size prop to change the size of the toggle group.",
      Demo: ToggleGroupSizes,
      source: docSource("toggle-group", "sizes"),
    },
    {
      id: "toggle-group-spacing",
      title: "Spacing",
      description: "Use spacing to add spacing between toggle group items.",
      Demo: ToggleGroupSpacing,
      source: docSource("toggle-group", "spacing"),
    },
    {
      id: "toggle-group-vertical",
      title: "Vertical",
      description: "Use orientation='vertical' for vertical toggle groups.",
      Demo: ToggleGroupVertical,
      source: docSource("toggle-group", "vertical"),
    },
  ],
  anatomy: [{ name: "ToggleGroup", children: [{ name: "ToggleGroupItem" }] }],
  features: [
    'type="single" behaves like a radio group (string value); type="multiple" toggles independently (string[] value).',
    "size/variant set on the group cascade to every item automatically — no need to repeat them per item.",
    "spacing={0} merges items into one segmented control with shared borders; spacing > 0 keeps them as separate pill buttons.",
    'orientation="vertical" stacks items in a column instead of a row.',
  ],
  api: [
    {
      name: "ToggleGroup",
      description: "A set of related toggles sharing one value.",
      props: [
        {
          name: "type",
          type: '"single" | "multiple"',
          description: "Single makes value a string; multiple makes it a string[].",
        },
        {
          name: "value / onValueChange",
          type: "string | string[] / (value) => void",
          description: "Controlled pressed item(s). In single mode value can be empty.",
        },
        {
          name: "variant",
          type: '"default" | "outline"',
          default: '"default"',
          description: "Visual style of the buttons.",
        },
        {
          name: "size",
          type: '"sm" | "default" | "lg"',
          default: '"default"',
          description: "Button size for the whole group.",
        },
      ],
    },
    {
      name: "ToggleGroupItem",
      props: [
        {
          name: "value",
          type: "string",
          description: "Identifier for this toggle (required).",
        },
      ],
    },
  ],
  accessibility: {
    keyboard: [
      { keys: ["Tab"], description: "Moves focus into the group." },
      { keys: ["Arrow", "Right"], description: "Moves to the next toggle." },
      { keys: ["Arrow", "Left"], description: "Moves to the previous toggle." },
      { keys: ["Space"], description: "Toggles the focused button." },
    ],
    notes: [
      "Single mode behaves as a radio group; multiple mode as a set of toggle buttons.",
      "Icon-only items must carry an aria-label, since there’s no visible text.",
      "In single mode, guard onValueChange against the empty string to keep a selection.",
    ],
  },
  guidelines: {
    do: [
      "Use single for mutually-exclusive choices (alignment).",
      "Use multiple for independent marks (bold, italic).",
    ],
    dont: ["Don’t mix unrelated actions into one group.", "Don’t leave icon items without an accessible label."],
  },
  related: ["toggle", "button-group", "radio-group"],
};
